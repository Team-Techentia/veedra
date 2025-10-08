const asyncHandler = require('express-async-handler');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Vendor = require('../models/Vendor');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/imports/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @desc    Get import template
// @route   GET /api/import/template
// @access  Private
const getImportTemplate = asyncHandler(async (req, res) => {
  const template = {
    headers: [
      'productName',
      'productCode',
      'barcode',
      'categoryName',
      'vendorName',
      'sellingPrice',
      'purchasePrice',
      'mrp',
      'currentStock',
      'minStockLevel',
      'unit',
      'description',
      'brand',
      'model',
      'size',
      'color',
      'weight',
      'dimensions',
      'expiryDate',
      'isActive'
    ],
    example: {
      productName: 'iPhone 15 Pro',
      productCode: 'IP15PRO001',
      barcode: '1234567890123',
      categoryName: 'Electronics',
      vendorName: 'Apple Inc',
      sellingPrice: 99999,
      purchasePrice: 85000,
      mrp: 105000,
      currentStock: 10,
      minStockLevel: 2,
      unit: 'piece',
      description: 'Latest iPhone with Pro features',
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      size: '6.1 inch',
      color: 'Space Black',
      weight: '187g',
      dimensions: '146.6 x 70.6 x 8.25 mm',
      expiryDate: '',
      isActive: true
    }
  };

  res.json({
    status: 'success',
    data: template
  });
});

// @desc    Import products from CSV/Excel
// @route   POST /api/import/products
// @access  Private
const importProducts = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const filePath = req.file.path;
  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  let products = [];

  try {
    if (fileExtension === '.csv') {
      // Parse CSV file
      products = await parseCSV(filePath);
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Parse Excel file
      products = await parseExcel(filePath);
    } else {
      throw new Error('Unsupported file format');
    }

    // Process and save products
    const result = await processProducts(products);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      status: 'success',
      data: result
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
});

// Parse CSV file
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const products = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        products.push(row);
      })
      .on('end', () => {
        resolve(products);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Parse Excel file
const parseExcel = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const products = XLSX.utils.sheet_to_json(worksheet);
    return products;
  } catch (error) {
    throw new Error('Failed to parse Excel file');
  }
};

// Process and save products
const processProducts = async (products) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < products.length; i++) {
    try {
      const productData = products[i];
      
      // Validate required fields
      if (!productData.productName || !productData.sellingPrice) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Product name and selling price are required`);
        continue;
      }

      // Find or create category
      let category = null;
      if (productData.categoryName) {
        category = await Category.findOne({ name: { $regex: new RegExp(productData.categoryName, 'i') } });
        if (!category) {
          category = await Category.create({
            name: productData.categoryName,
            description: `Auto-created for ${productData.categoryName}`
          });
        }
      }

      // Find or create vendor
      let vendor = null;
      if (productData.vendorName) {
        vendor = await Vendor.findOne({ name: { $regex: new RegExp(productData.vendorName, 'i') } });
        if (!vendor) {
          vendor = await Vendor.create({
            name: productData.vendorName,
            email: `${productData.vendorName.toLowerCase().replace(/\s+/g, '')}@vendor.com`,
            phone: '0000000000',
            address: {
              street: 'Auto-generated',
              city: 'Unknown',
              state: 'Unknown',
              pincode: '000000'
            }
          });
        }
      }

      // Generate product code if not provided
      const productCode = productData.productCode || await generateProductCode(category?.name || 'GEN');

      // Create product
      const product = await Product.create({
        name: productData.productName,
        productCode,
        barcode: productData.barcode || '',
        category: category?._id,
        vendor: vendor?._id,
        pricing: {
          sellingPrice: parseFloat(productData.sellingPrice) || 0,
          purchasePrice: parseFloat(productData.purchasePrice) || 0,
          mrp: parseFloat(productData.mrp) || parseFloat(productData.sellingPrice) || 0,
          tax: {
            type: 'percentage',
            value: 18 // Default GST
          }
        },
        inventory: {
          currentStock: parseInt(productData.currentStock) || 0,
          minStockLevel: parseInt(productData.minStockLevel) || 1,
          unit: productData.unit || 'piece'
        },
        description: productData.description || '',
        specifications: {
          brand: productData.brand || '',
          model: productData.model || '',
          size: productData.size || '',
          color: productData.color || '',
          weight: productData.weight || '',
          dimensions: productData.dimensions || ''
        },
        expiryDate: productData.expiryDate ? new Date(productData.expiryDate) : null,
        isActive: productData.isActive !== 'false' && productData.isActive !== false
      });

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  return results;
};

// Generate product code
const generateProductCode = async (categoryName) => {
  const prefix = categoryName.substring(0, 3).toUpperCase();
  const count = await Product.countDocuments({ 
    productCode: { $regex: new RegExp(`^${prefix}`) } 
  });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
};

module.exports = {
  upload,
  getImportTemplate,
  importProducts
};