const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Combo name is required'],
    trim: true,
    maxlength: [100, 'Combo name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: function() {
      return !this.isNew;
    },
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Combo Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  
  // Price Slots Configuration - Key Feature for E-commerce
  priceSlots: [{
    slotName: {
      type: String,
      required: true,
      trim: true
    },
    minPrice: {
      type: Number,
      required: true,
      min: [0, 'Min price cannot be negative']
    },
    maxPrice: {
      type: Number,
      required: true,
      min: [0, 'Max price cannot be negative']
    },
    maxProducts: {
      type: Number,
      default: 10,
      min: [1, 'Max products must be at least 1']
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, 'Priority must be at least 1']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Combo Rules
  rules: {
    totalProducts: {
      min: {
        type: Number,
        default: 2,
        min: [2, 'Minimum 2 products required for combo']
      },
      max: {
        type: Number,
        default: 10,
        min: [2, 'Maximum products must be at least 2']
      }
    },
    allowDuplicates: {
      type: Boolean,
      default: false
    },
    requireAllSlots: {
      type: Boolean,
      default: false
    },
    minimumValue: {
      type: Number,
      default: 0,
      min: [0, 'Minimum value cannot be negative']
    },
    maximumValue: {
      type: Number,
      default: 999999,
      min: [0, 'Maximum value cannot be negative']
    }
  },
  
  // Discount Configuration
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'buy_x_get_y'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: [0, 'Discount value cannot be negative']
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Max discount cannot be negative']
  },
  
  // Validity Period
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date
  },
  
  // Auto-Assignment Settings - Prevent high-value products in low-value slots
  autoAssignment: {
    enabled: {
      type: Boolean,
      default: true
    },
    preventHighValueInLowSlot: {
      type: Boolean,
      default: true
    },
    allowPriceAdjustment: {
      type: Boolean,
      default: false
    }
  },
  
  // Eligible Categories and Vendors
  eligibleCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  eligibleVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  
  // Applicable Products (for specific product combos)
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Excluded Products
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Usage Limits
  usageLimits: {
    totalUsage: {
      type: Number,
      default: null
    },
    usageCount: {
      type: Number,
      default: 0
    }
  },
  
  // Analytics
  analytics: {
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalSavings: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    }
  },
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // System Fields
  sortOrder: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes for better performance
comboSchema.index({ code: 1 });
comboSchema.index({ isActive: 1 });
comboSchema.index({ isPaused: 1 });
comboSchema.index({ validFrom: 1, validUntil: 1 });
comboSchema.index({ sortOrder: 1 });

// Generate combo code
comboSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    const timestamp = Date.now().toString().slice(-6);
    this.code = `CMB${timestamp}`;
  }
  next();
});

// Method to check if combo is currently valid
comboSchema.methods.isCurrentlyValid = function() {
  const now = new Date();
  
  if (!this.isActive || this.isPaused) return false;
  
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;
  
  if (this.usageLimits.totalUsage && this.usageLimits.usageCount >= this.usageLimits.totalUsage) {
    return false;
  }
  
  return true;
};

// Method to find appropriate slot for a product price
comboSchema.methods.findSlotForPrice = function(price) {
  const activeSlots = this.priceSlots.filter(slot => slot.isActive);
  const sortedSlots = activeSlots.sort((a, b) => b.priority - a.priority);
  
  for (let slot of sortedSlots) {
    if (price >= slot.minPrice && price <= slot.maxPrice) {
      return slot;
    }
  }
  
  return null;
};

// Method to validate if product can be assigned to slot (prevent high-value in low slot)
comboSchema.methods.canAssignToSlot = function(productPrice, slot) {
  if (!this.autoAssignment.preventHighValueInLowSlot) return true;
  
  // Find if there are higher value slots available
  const higherSlots = this.priceSlots.filter(s => 
    s.isActive && s.minPrice > slot.maxPrice
  );
  
  // If product price is significantly higher than slot max, prevent assignment
  const priceBuffer = slot.maxPrice * 0.2; // 20% buffer
  if (productPrice > (slot.maxPrice + priceBuffer) && higherSlots.length > 0) {
    return false;
  }
  
  return true;
};

// Static method to get active combos
comboSchema.statics.getActiveCombos = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    isPaused: false,
    $or: [
      { validFrom: { $lte: now } },
      { validFrom: { $exists: false } }
    ],
    $or: [
      { validUntil: { $gte: now } },
      { validUntil: { $exists: false } }
    ]
  }).sort({ sortOrder: 1, createdAt: -1 });
};

// Static method to get combo statistics
comboSchema.statics.getComboStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalCombos: { $sum: 1 },
        activeCombos: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        pausedCombos: { $sum: { $cond: [{ $eq: ['$isPaused', true] }, 1, 0] } },
        totalRevenue: { $sum: '$analytics.totalRevenue' },
        totalSavings: { $sum: '$analytics.totalSavings' },
        avgOrderValue: { $avg: '$analytics.averageOrderValue' }
      }
    }
  ]);
};

module.exports = mongoose.model('Combo', comboSchema);