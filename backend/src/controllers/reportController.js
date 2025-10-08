const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

const getSalesReport = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: {
      totalSales: 0,
      salesCount: 0,
      avgOrderValue: 0
    },
    message: 'Sales report coming soon'
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
      totalValue: 0 // Would calculate from actual inventory
    }
  });
});

const getCommissionReport = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({ isActive: true });
  const staff = await User.find({ role: 'staff', isActive: true });
  
  res.json({
    status: 'success',
    data: {
      vendorCommissions: vendors.map(v => ({
        name: v.name,
        totalCommission: v.totalCommissionEarned,
        rate: v.commissionRate
      })),
      staffCommissions: staff.map(s => ({
        name: s.name,
        totalCommission: 0, // Would calculate from sales
        rate: s.commissionRate
      }))
    }
  });
});

const getProductPerformance = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true })
    .sort({ totalSold: -1 })
    .limit(10)
    .populate('category', 'name');
  
  res.json({
    status: 'success',
    data: products.map(p => ({
      name: p.name,
      category: p.category.name,
      totalSold: p.totalSold,
      revenue: p.totalRevenue
    }))
  });
});

const exportReport = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Report export coming soon'
  });
});

module.exports = {
  getSalesReport,
  getInventoryReport,
  getCommissionReport,
  getProductPerformance,
  exportReport
};