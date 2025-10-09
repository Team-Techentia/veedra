const mongoose = require('mongoose');
const Combo = require('../models/Combo');

// Get all combos
const getCombos = async (req, res) => {
  try {
    const combos = await Combo.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: combos
    });
  } catch (error) {
    console.error('Error fetching combos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch combos',
      error: error.message
    });
  }
};

// Get single combo
const getCombo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid combo ID'
      });
    }

    const combo = await Combo.findById(id);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    res.json({
      success: true,
      data: combo
    });
  } catch (error) {
    console.error('Error fetching combo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch combo',
      error: error.message
    });
  }
};

// Create combo
const createCombo = async (req, res) => {
  try {
    const comboData = { 
      ...req.body,
      createdAt: new Date()
    };

    const combo = new Combo(comboData);
    await combo.save();

    res.status(201).json({
      success: true,
      data: combo,
      message: 'Combo created successfully'
    });
  } catch (error) {
    console.error('Error creating combo:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Combo SKU already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create combo',
      error: error.message
    });
  }
};

// Update combo
const updateCombo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid combo ID'
      });
    }

    const updateData = { ...req.body };

    const combo = await Combo.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    res.json({
      success: true,
      data: combo,
      message: 'Combo updated successfully'
    });
  } catch (error) {
    console.error('Error updating combo:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Combo SKU already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update combo',
      error: error.message
    });
  }
};

// Delete combo
const deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid combo ID'
      });
    }

    const combo = await Combo.findByIdAndDelete(id);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    res.json({
      success: true,
      message: 'Combo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting combo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete combo',
      error: error.message
    });
  }
};

// Get active combos
const getActiveCombos = async (req, res) => {
  try {
    const activeCombos = await Combo.getActiveCombos();

    res.json({
      success: true,
      data: activeCombos
    });
  } catch (error) {
    console.error('Error fetching active combos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active combos',
      error: error.message
    });
  }
};

// Validate combo for products
const validateComboForProducts = async (req, res) => {
  try {
    const { comboId, productIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(comboId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid combo ID'
      });
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }

    const combo = await Combo.findById(comboId);
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    // Check if combo is currently valid
    const status = combo.getStatus();
    if (status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Combo is ${status}, not active`
      });
    }

    res.json({
      success: true,
      message: 'Combo validation successful',
      data: {
        combo,
        isValid: true
      }
    });
  } catch (error) {
    console.error('Error validating combo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate combo',
      error: error.message
    });
  }
};

// Get combo statistics
const getComboStats = async (req, res) => {
  try {
    const totalCombos = await Combo.countDocuments();
    const activeCombos = await Combo.countDocuments({ paused: false });
    const pausedCombos = await Combo.countDocuments({ paused: true });
    
    const stats = {
      totalCombos,
      activeCombos,
      pausedCombos,
      totalRevenue: 0, // Would need to calculate from billing data
      totalSavings: 0, // Would need to calculate from billing data
      avgOrderValue: 0 // Would need to calculate from billing data
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching combo stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch combo statistics',
      error: error.message
    });
  }
};

module.exports = {
  getCombos,
  getCombo,
  createCombo,
  updateCombo,
  deleteCombo,
  getActiveCombos,
  validateComboForProducts,
  getComboStats
};