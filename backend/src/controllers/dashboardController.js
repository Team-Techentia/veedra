const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

const getOwnerDashboard = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments({ isActive: true });
  const totalVendors = await Vendor.countDocuments({ isActive: true });
  const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });
  const lowStockProducts = await Product.getLowStockProducts();
  
  res.json({
    status: 'success',
    data: {
      summary: {
        totalProducts,
        totalVendors,
        totalStaff,
        lowStockCount: lowStockProducts.length
      },
      sales: {
        todaySales: 0,
        monthSales: 0,
        yearSales: 0
      },
      commissions: {
        vendorCommissions: 0,
        staffCommissions: 0
      },
      lowStockProducts: lowStockProducts.slice(0, 5)
    }
  });
});

const getManagerDashboard = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments({ isActive: true });
  const lowStockProducts = await Product.getLowStockProducts();
  
  res.json({
    status: 'success',
    data: {
      inventory: {
        totalProducts,
        lowStockCount: lowStockProducts.length
      },
      sales: {
        todaySales: 0,
        weekSales: 0
      },
      lowStockProducts: lowStockProducts.slice(0, 10)
    }
  });
});

const getStaffDashboard = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: {
      sales: {
        todaySales: 0,
        weekSales: 0,
        monthSales: 0
      },
      commission: {
        earned: 0,
        pending: 0,
        rate: req.user.commissionRate || 0
      },
      recentBills: []
    }
  });
});

module.exports = {
  getOwnerDashboard,
  getManagerDashboard,
  getStaffDashboard
};