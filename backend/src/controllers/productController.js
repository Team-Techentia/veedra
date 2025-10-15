const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, vendor, search } = req.query;
  
  let query = { isActive: true };
  
  if (category) query.category = category;
  if (vendor) query.vendor = vendor;
  if (search) {
    query.$text = { $search: search };
  }
  
  // Get all products without pagination to ensure parent-child integrity
  const allProducts = await Product.find(query)
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .populate('vendor', 'name')
    .sort({ createdAt: -1 });
  
  // Separate parents and children
  const parents = allProducts.filter(p => p.type === 'parent' || p.type === 'standalone');
  const children = allProducts.filter(p => p.type === 'child');
  
  // Get parent IDs that have children
  const childParentIds = new Set(children.map(c => c.parentProduct?.toString()).filter(Boolean));
  
  // Ensure all parent products with children are included
  const missingParents = [];
  for (const parentId of childParentIds) {
    if (!parents.find(p => p._id.toString() === parentId)) {
      const parent = await Product.findById(parentId)
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .populate('vendor', 'name');
      if (parent) {
        missingParents.push(parent);
      }
    }
  }
  
  // Combine all products ensuring parent-child integrity
  const products = [...parents, ...children, ...missingParents];
  
  const total = await Product.countDocuments(query);
  
  res.json({
    status: 'success',
    data: products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category')
    .populate('subcategory')
    .populate('vendor')
    .populate('childProducts');
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  res.json({
    status: 'success',
    data: product
  });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Manager
const createProduct = asyncHandler(async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    // Handle empty subcategory field
    if (productData.subcategory === '' || productData.subcategory === null) {
      delete productData.subcategory;
    }
    
    // Check if this is a bundle product
    if (productData.bundle?.isBundle && productData.bundle?.bundleSize > 1) {
      // Create bundle with children
      const bundle = await Product.createBundleWithChildren(productData, req.user.id);
      
      // Get the complete bundle with children
      const bundleSummary = await bundle.getBundleSummary();
      
      res.status(201).json({
        status: 'success',
        data: bundle,
        bundleSummary,
        message: `Bundle created successfully with ${bundleSummary.summary.totalChildren} child products`
      });
    } else {
      // Create regular product
      const product = await Product.create(productData);
      
      res.status(201).json({
        status: 'success',
        data: product
      });
    }
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Manager
const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    // If this is a parent product, update children if needed
    if (product.type === 'parent' && product.bundle?.isBundle) {
      await product.updateChildProducts(req.body);
    }
    
    res.json({
      status: 'success',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Manager
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let deletedCount = 1;
  
  // If deleting a parent product, also delete all child products
  if (product.type === 'parent' && product.bundle?.isBundle) {
    const childProducts = await Product.find({ parentProduct: req.params.id });
    deletedCount += childProducts.length;
    
    // Delete all child products
    await Product.deleteMany({ parentProduct: req.params.id });
  }
  
  // Delete the main product
  await Product.findByIdAndDelete(req.params.id);
  
  res.json({
    status: 'success',
    message: `Product${deletedCount > 1 ? 's' : ''} deleted successfully`,
    deletedCount
  });
});

// @desc    Bulk create products
// @route   POST /api/products/bulk
// @access  Private/Manager
const bulkCreateProducts = asyncHandler(async (req, res) => {
  try {
    const { products, options = {} } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Products array is required'
      });
    }
    
    const results = await Product.bulkCreateProducts(products, req.user.id, options);
    
    res.status(201).json({
      status: 'success',
      data: results,
      message: `Bulk creation completed. Success: ${results.success.length}, Bundles: ${results.bundles.length}, Errors: ${results.errors.length}`
    });
  } catch (error) {
    console.error('Bulk create products error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Private
const searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    res.status(400);
    throw new Error('Search query required');
  }
  
  const products = await Product.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { code: { $regex: q, $options: 'i' } },
          { barcode: { $regex: q, $options: 'i' } }
        ]
      }
    ]
  }).limit(20);
  
  res.json({
    status: 'success',
    data: products
  });
});

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private/Manager
const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.getLowStockProducts();
  
  res.json({
    status: 'success',
    data: products
  });
});

// @desc    Generate barcode
// @route   GET /api/products/:id/barcode
// @access  Private
const generateBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  try {
    const BarcodeService = require('../services/barcodeService');
    const barcodeData = BarcodeService.generateProductBarcode(product);
    
    res.json({
      status: 'success',
      data: barcodeData
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate barcode',
      error: error.message
    });
  }
});

// @desc    Generate bundle barcodes
// @route   GET /api/products/:id/bundle-barcodes
// @access  Private
const generateBundleBarcodes = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  if (product.type !== 'parent' || !product.bundle?.isBundle) {
    res.status(400);
    throw new Error('Product is not a bundle');
  }
  
  try {
    const childProducts = await Product.find({ parentProduct: req.params.id });
    const BarcodeService = require('../services/barcodeService');
    const bundleBarcodes = BarcodeService.generateBundleBarcodes(product, childProducts);
    
    res.json({
      status: 'success',
      data: {
        parent: bundleBarcodes.find(b => b.role === 'parent'),
        children: bundleBarcodes.filter(b => b.role === 'child'),
        totalCount: bundleBarcodes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate bundle barcodes',
      error: error.message
    });
  }
});

// @desc    Get bundle summary
// @route   GET /api/products/:id/bundle-summary
// @access  Private
const getBundleSummary = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    if (product.type !== 'parent' || !product.bundle?.isBundle) {
      return res.status(400).json({
        status: 'error',
        message: 'Product is not a bundle'
      });
    }
    
    const bundleSummary = await product.getBundleSummary();
    
    res.json({
      status: 'success',
      data: bundleSummary
    });
  } catch (error) {
    console.error('Get bundle summary error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Create child products for bundle
// @route   POST /api/products/:id/create-children
// @access  Private/Manager
const createChildProducts = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    if (product.type !== 'parent' || !product.bundle?.isBundle) {
      return res.status(400).json({
        status: 'error',
        message: 'Product is not a bundle'
      });
    }
    
    const childProducts = await product.createChildProducts(req.user.id);
    
    res.status(201).json({
      status: 'success',
      data: childProducts,
      message: `Created ${childProducts.length} child products`
    });
  } catch (error) {
    console.error('Create child products error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get all bundles
// @route   GET /api/products/bundles
// @access  Private
const getBundles = asyncHandler(async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    const bundles = await Product.getBundles({ includeInactive });
    
    res.json({
      status: 'success',
      data: bundles
    });
  } catch (error) {
    console.error('Get bundles error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get products by barcode (for scanning)
// @route   GET /api/products/scan/:barcode
// @access  Private
const scanProductByBarcode = asyncHandler(async (req, res) => {
  try {
    const { barcode } = req.params;
    
    if (!barcode) {
      return res.status(400).json({
        status: 'error',
        message: 'Barcode is required'
      });
    }
    
    const product = await Product.findOne({ 
      barcode: barcode,
      isActive: true 
    })
      .populate('category', 'name code')
      .populate('subcategory', 'name code')
      .populate('vendor', 'name')
      .populate('parentProduct', 'name code bundle');
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found with this barcode'
      });
    }
    
    // Check stock availability
    const stockStatus = product.stockStatus;
    
    res.json({
      status: 'success',
      data: {
        ...product.toJSON(),
        stockStatus,
        scanTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Scan product error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @desc    Get combo eligible products
// @route   GET /api/products/combo-eligible
// @access  Private
const getComboEligibleProducts = asyncHandler(async (req, res) => {
  try {
    const { 
      priceRange, 
      category, 
      vendor, 
      inStock = true,
      page = 1,
      limit = 50 
    } = req.query;
    
    let query = {
      isActive: true,
      isComboEligible: true
    };
    
    if (category) query.category = category;
    if (vendor) query.vendor = vendor;
    if (inStock) query['inventory.currentStock'] = { $gt: 0 };
    
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      query['pricing.offerPrice'] = { $gte: min, $lte: max };
    }
    
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('vendor', 'name')
      .select('name code barcode pricing inventory category subcategory vendor isComboEligible')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'pricing.offerPrice': 1 });
    
    const total = await Product.countDocuments(query);
    
    res.json({
      status: 'success',
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get combo eligible products error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
  searchProducts,
  getLowStockProducts,
  generateBarcode,
  generateBundleBarcodes,
  getBundleSummary,
  createChildProducts,
  getBundles,
  scanProductByBarcode,
  getComboEligibleProducts
};