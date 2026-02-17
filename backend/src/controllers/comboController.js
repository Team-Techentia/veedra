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

    // Remove empty SKU to let model generate it
    if (!comboData.sku || comboData.sku.trim() === '') {
      delete comboData.sku;
    }

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

// Create Quantity Slab Combo
const createQuantitySlabCombo = async (req, res) => {
  try {
    const { name, minPrice, maxPrice, slabs, validFrom, validTo, notes } = req.body;

    // Validation
    if (!name || !minPrice || !maxPrice || !slabs || !Array.isArray(slabs) || slabs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'name, minPrice, maxPrice, and slabs array are required'
      });
    }

    // Validate price range
    if (parseFloat(minPrice) > parseFloat(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: 'minPrice cannot be greater than maxPrice'
      });
    }

    // Validate slabs
    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];

      if (!slab.minQuantity || !slab.slabPrice) {
        return res.status(400).json({
          success: false,
          message: `Slab ${i + 1}: minQuantity and slabPrice are required`
        });
      }

      // Ensure slabs are in ascending order by quantity
      if (i > 0 && slab.minQuantity <= slabs[i - 1].minQuantity) {
        return res.status(400).json({
          success: false,
          message: `Slab ${i + 1}: minQuantity must be greater than previous slab's minQuantity`
        });
      }

      // Warn if prices increase as quantity increases
      if (i > 0 && slab.slabPrice > slabs[i - 1].slabPrice) {
        console.warn(`⚠️ Warning: Slab ${i + 1} price is higher than previous slab`);
      }
    }

    const comboData = {
      name,
      type: 'custom',
      comboType: 'quantity_slab',
      offerPrice: slabs[0].slabPrice, // First slab price
      qtyProducts: 999, // Unlimited
      notes: notes || `Auto-apply quantity-based pricing for ₹${minPrice}-₹${maxPrice} products`,
      quantitySlabConfig: {
        enabled: true,
        minPrice: parseFloat(minPrice),
        maxPrice: parseFloat(maxPrice),
        slabs,
        applyLastSlabForHigher: true,
        autoApply: true
      },
      colorTag: 'Blue',
      paused: false
    };

    // Add validity dates if provided
    if (validFrom) comboData.validFrom = new Date(validFrom);
    if (validTo) comboData.validTo = new Date(validTo);

    const combo = await Combo.create(comboData);

    console.log(`✅ Quantity slab combo created: "${name}" for ₹${minPrice}-₹${maxPrice} products with ${slabs.length} slabs`);

    res.status(201).json({
      success: true,
      data: combo,
      message: 'Quantity slab combo created successfully'
    });
  } catch (error) {
    console.error('Error creating quantity slab combo:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create quantity slab combo',
      error: error.message
    });
  }
};

// Toggle combo active status
const toggleComboStatus = async (req, res) => {
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

    // Toggle isActive status
    combo.isActive = !combo.isActive;
    await combo.save();

    res.json({
      success: true,
      data: combo,
      message: `Combo ${combo.isActive ? 'activated' : 'paused'} successfully`
    });
  } catch (error) {
    console.error('Error toggling combo status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle combo status',
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
  getComboStats,
  createQuantitySlabCombo,
  toggleComboStatus
};