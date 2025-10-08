const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

const getInventory = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true })
    .populate('category', 'name')
    .populate('vendor', 'name')
    .select('name code inventory pricing category vendor');
  
  res.json({
    status: 'success',
    data: products
  });
});

const adjustStock = asyncHandler(async (req, res) => {
  const { productId, adjustment, type, reason } = req.body;
  
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  const newStock = product.inventory.currentStock + adjustment;
  if (newStock < 0) {
    res.status(400);
    throw new Error('Insufficient stock');
  }
  
  product.inventory.currentStock = newStock;
  await product.save();
  
  res.json({
    status: 'success',
    data: product,
    message: 'Stock adjusted successfully'
  });
});

const getStockMovements = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: [],
    message: 'Stock movements coming soon'
  });
});

const bulkStockAdjustment = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Bulk stock adjustment coming soon'
  });
});

const getInventoryReport = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments({ isActive: true });
  const lowStockProducts = await Product.getLowStockProducts();
  
  res.json({
    status: 'success',
    data: {
      totalProducts,
      lowStockCount: lowStockProducts.length,
      lowStockProducts
    }
  });
});

module.exports = {
  getInventory,
  adjustStock,
  getStockMovements,
  bulkStockAdjustment,
  getInventoryReport
};