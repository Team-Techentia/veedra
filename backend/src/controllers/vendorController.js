const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private/Manager
const getVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({ isActive: true });
  
  res.json({
    status: 'success',
    count: vendors.length,
    data: vendors
  });
});

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Private/Manager
const getVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }
  
  res.json({
    status: 'success',
    data: vendor
  });
});

// @desc    Create vendor
// @route   POST /api/vendors
// @access  Private/Manager
const createVendor = asyncHandler(async (req, res) => {
  const vendorData = {
    ...req.body,
    createdBy: req.user.id
  };
  
  const vendor = await Vendor.create(vendorData);
  
  res.status(201).json({
    status: 'success',
    data: vendor
  });
});

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private/Manager
const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }
  
  const updatedVendor = await Vendor.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.json({
    status: 'success',
    data: updatedVendor
  });
});

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private/Manager
const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }
  
  vendor.isActive = false;
  await vendor.save();
  
  res.json({
    status: 'success',
    message: 'Vendor deactivated successfully'
  });
});

// @desc    Get vendor commissions
// @route   GET /api/vendors/:id/commissions
// @access  Private/Manager
const getVendorCommissions = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }
  
  // This would typically fetch commission data from sales
  res.json({
    status: 'success',
    data: {
      vendor: vendor.name,
      totalCommission: vendor.totalCommissionEarned,
      commissionRate: vendor.commissionRate,
      transactions: [] // Would be populated from actual sales data
    }
  });
});

module.exports = {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorCommissions
};