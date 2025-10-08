const Combo = require('../models/Combo');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @desc    Get all combos with filtering and pagination
// @route   GET /api/combos
// @access  Private
const getCombos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      priceRange,
      slotFilter
    } = req.query;

    // Build query
    let query = {};
    
    if (status) {
      query.isActive = status === 'active';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      query['priceSlots.minPrice'] = { $lte: max };
      query['priceSlots.maxPrice'] = { $gte: min };
    }
    
    if (slotFilter) {
      query['priceSlots.name'] = { $regex: slotFilter, $options: 'i' };
    }

    // Execute query with pagination
    const combos = await Combo.find(query)
      .populate('eligibleCategories', 'name code')
      .populate('eligibleVendors', 'name code')
      .populate('applicableProducts', 'name code pricing.sellingPrice')
      .populate('excludedProducts', 'name code sellingPrice')
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Combo.countDocuments(query);

    // Calculate combo statistics
    const stats = await Combo.getComboStats();

    res.status(200).json({
      success: true,
      data: combos,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      },
      stats: stats[0] || {
        totalCombos: 0,
        activeCombos: 0,
        totalSlots: 0,
        averageDiscount: 0
      }
    });
  } catch (error) {
    console.error('Get combos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching combos',
      error: error.message
    });
  }
};

// @desc    Get single combo by ID
// @route   GET /api/combos/:id
// @access  Private
const getCombo = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id)
      .populate('applicableProducts', 'name code pricing.sellingPrice category vendor')
      .populate('createdBy', 'firstName lastName')
      .populate('lastModifiedBy', 'firstName lastName');

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    // Get basic analytics from combo model
    const analytics = {
      totalUsage: combo.usageLimits?.usageCount || 0,
      totalRevenue: combo.analytics?.totalRevenue || 0,
      totalSavings: combo.analytics?.totalSavings || 0,
      averageOrderValue: combo.analytics?.averageOrderValue || 0
    };

    res.status(200).json({
      success: true,
      data: {
        ...combo.toJSON(),
        analytics
      }
    });
  } catch (error) {
    console.error('Get combo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching combo',
      error: error.message
    });
  }
};

// @desc    Create new combo
// @route   POST /api/combos
// @access  Private (Manager/Owner)
const createCombo = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      priceSlots,
      discountType,
      discountValue,
      applicableProducts,
      validFrom,
      validTo,
      usageLimit,
      isActive
    } = req.body;

    // Validate price slots
    if (!priceSlots || priceSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one price slot is required'
      });
    }

    // Check for overlapping price ranges
    for (let i = 0; i < priceSlots.length; i++) {
      for (let j = i + 1; j < priceSlots.length; j++) {
        const slot1 = priceSlots[i];
        const slot2 = priceSlots[j];
        
        if (!(slot1.maxPrice < slot2.minPrice || slot2.maxPrice < slot1.minPrice)) {
          return res.status(400).json({
            success: false,
            message: `Price slots "${slot1.slotName || slot1.name}" and "${slot2.slotName || slot2.name}" have overlapping ranges`
          });
        }
      }
    }

    // Validate applicable products exist
    if (applicableProducts && applicableProducts.length > 0) {
      const existingProducts = await Product.find({
        _id: { $in: applicableProducts },
        isActive: true,
        isComboEligible: true
      });

      if (existingProducts.length !== applicableProducts.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more selected products are not available or not combo eligible'
        });
      }
    }

    // Create combo
    const combo = new Combo({
      name,
      description,
      priceSlots: priceSlots.map(slot => ({
        ...slot,
        currentItems: 0,
        totalValue: 0
      })),
      discountType,
      discountValue,
      applicableProducts: applicableProducts || [],
      validFrom: validFrom || new Date(),
      validTo,
      usageLimit,
      isActive: isActive !== false,
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    });

    await combo.save();

    // Populate the created combo
    const populatedCombo = await Combo.findById(combo._id)
      .populate('applicableProducts', 'name code pricing.sellingPrice')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Combo created successfully',
      data: populatedCombo
    });
  } catch (error) {
    console.error('Create combo error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A combo with this name or code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating combo',
      error: error.message
    });
  }
};

// @desc    Update combo
// @route   PUT /api/combos/:id
// @access  Private (Manager/Owner)
const updateCombo = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const updateData = { ...req.body };
    updateData.lastModifiedBy = req.user.id;

    // If updating price slots, validate them
    if (updateData.priceSlots) {
      // Check for overlapping price ranges
      for (let i = 0; i < updateData.priceSlots.length; i++) {
        for (let j = i + 1; j < updateData.priceSlots.length; j++) {
          const slot1 = updateData.priceSlots[i];
          const slot2 = updateData.priceSlots[j];
          
          if (!(slot1.maxPrice < slot2.minPrice || slot2.maxPrice < slot1.minPrice)) {
            return res.status(400).json({
              success: false,
              message: `Price slots "${slot1.name}" and "${slot2.name}" have overlapping ranges`
            });
          }
        }
      }
    }

    // If updating applicable products, validate them
    if (updateData.applicableProducts) {
      const existingProducts = await Product.find({
        _id: { $in: updateData.applicableProducts },
        isActive: true,
        isComboEligible: true
      });

      if (existingProducts.length !== updateData.applicableProducts.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more selected products are not available or not combo eligible'
        });
      }
    }

    const updatedCombo = await Combo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('applicableProducts', 'name code pricing.sellingPrice')
     .populate('lastModifiedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Combo updated successfully',
      data: updatedCombo
    });
  } catch (error) {
    console.error('Update combo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating combo',
      error: error.message
    });
  }
};

// @desc    Delete combo
// @route   DELETE /api/combos/:id
// @access  Private (Manager/Owner)
const deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    // Check if combo is currently being used
    const isInUse = combo.currentUsage > 0;
    
    if (isInUse && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete combo that is currently in use. Use force=true to override.',
        currentUsage: combo.currentUsage
      });
    }

    await Combo.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Combo deleted successfully'
    });
  } catch (error) {
    console.error('Delete combo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting combo',
      error: error.message
    });
  }
};

// @desc    Find suitable combo for products
// @route   POST /api/combos/find-suitable
// @access  Private
const findSuitableCombo = async (req, res) => {
  try {
    const { products } = req.body; // Array of { productId, quantity, price }
    
    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required'
      });
    }

    // Get all active combos
    const combos = await Combo.find({
      isActive: true,
      $expr: {
        $or: [
          { $eq: ['$validTo', null] },
          { $gte: ['$validTo', new Date()] }
        ]
      },
      $expr: {
        $lte: ['$validFrom', new Date()]
      }
    }).populate('applicableProducts');

    const suitableCombos = [];

    for (const combo of combos) {
      if (!combo.isCurrentlyValid()) continue;

      const assignment = combo.findBestProductAssignment(products);
      
      if (assignment.canAssign && assignment.totalSavings > 0) {
        suitableCombos.push({
          combo: combo,
          assignment: assignment,
          savings: assignment.totalSavings,
          efficiency: assignment.totalSavings / assignment.totalValue
        });
      }
    }

    // Sort by savings (descending)
    suitableCombos.sort((a, b) => b.savings - a.savings);

    res.status(200).json({
      success: true,
      data: suitableCombos.slice(0, 5), // Return top 5 suitable combos
      message: `Found ${suitableCombos.length} suitable combo(s)`
    });
  } catch (error) {
    console.error('Find suitable combo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding suitable combos',
      error: error.message
    });
  }
};

// @desc    Apply combo to products
// @route   POST /api/combos/:id/apply
// @access  Private
const applyCombo = async (req, res) => {
  try {
    const { products, autoAssign = true } = req.body;
    
    const combo = await Combo.findById(req.params.id);
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    if (!combo.isCurrentlyValid()) {
      return res.status(400).json({
        success: false,
        message: 'Combo is not currently valid',
        validFrom: combo.validFrom,
        validTo: combo.validTo
      });
    }

    let assignment;
    
    if (autoAssign) {
      // Auto-assign products to best slots
      assignment = combo.findBestProductAssignment(products);
    } else {
      // Manual assignment provided
      assignment = combo.validateProductAssignment(products);
    }

    if (!assignment.canAssign) {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply combo to these products',
        reasons: assignment.reasons
      });
    }

    // Update combo usage
    combo.currentUsage += 1;
    combo.totalSaved += assignment.totalSavings;
    
    // Update slot statistics
    assignment.slotAssignments.forEach(slotAssignment => {
      const slot = combo.priceSlots.find(s => s.name === slotAssignment.slotName);
      if (slot) {
        slot.currentItems += slotAssignment.products.length;
        slot.totalValue += slotAssignment.totalValue;
      }
    });

    await combo.save();

    res.status(200).json({
      success: true,
      message: 'Combo applied successfully',
      data: {
        combo: combo,
        assignment: assignment,
        totalSavings: assignment.totalSavings,
        finalTotal: assignment.totalValue - assignment.totalSavings
      }
    });
  } catch (error) {
    console.error('Apply combo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while applying combo',
      error: error.message
    });
  }
};

// @desc    Toggle combo status
// @route   PATCH /api/combos/:id/toggle
// @access  Private (Manager/Owner)
const toggleComboStatus = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    combo.isActive = !combo.isActive;
    combo.lastModifiedBy = req.user.id;
    await combo.save();

    res.status(200).json({
      success: true,
      message: `Combo ${combo.isActive ? 'activated' : 'deactivated'} successfully`,
      data: combo
    });
  } catch (error) {
    console.error('Toggle combo status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling combo status',
      error: error.message
    });
  }
};

// @desc    Validate combo slot assignment
// @route   POST /api/combos/validate-slot
// @access  Private
const validateComboSlot = async (req, res) => {
  try {
    const { comboId, products } = req.body;
    
    const combo = await Combo.findById(comboId);
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    if (!combo.isCurrentlyValid()) {
      return res.status(400).json({
        success: false,
        message: 'Combo is not currently valid'
      });
    }

    const validation = combo.validateProductAssignment(products);

    res.status(200).json({
      success: true,
      data: validation,
      message: validation.canAssign ? 'Assignment is valid' : 'Assignment has issues'
    });
  } catch (error) {
    console.error('Validate combo slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating combo slot',
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
  findSuitableCombo,
  applyCombo,
  toggleComboStatus,
  validateComboSlot
};