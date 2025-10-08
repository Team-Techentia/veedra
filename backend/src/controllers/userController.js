const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Owner
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  
  res.json({
    status: 'success',
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Owner
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.json({
    status: 'success',
    data: user
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Owner
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, commissionRate } = req.body;
  
  // Check if user exists
  const userExists = await User.findOne({ email });
  
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  
  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    commissionRate
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      commissionRate: user.commissionRate,
      isActive: user.isActive
    }
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Owner/Manager
const updateUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    // Prepare update data
    const updateData = { ...req.body };
    
    // Handle password separately if provided
    if (updateData.password && updateData.password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      // Remove password from update if not provided
      delete updateData.password;
    }
    
    // Use findByIdAndUpdate with proper options
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: false, // Skip validation to avoid password required error
        context: 'query'
      }
    ).select('-password');
    
    res.json({
      status: 'success',
      data: updatedUser
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update user'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Owner
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  await User.findByIdAndDelete(req.params.id);
  
  res.json({
    status: 'success',
    message: 'User deleted successfully'
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};