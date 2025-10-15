const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema({
  // Basic Information
  sku: {
    type: String,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Combo name is required'],
    trim: true,
    maxlength: [100, 'Combo name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['outfit', 'clearance', 'festive', 'family', 'kids', 'accessory', 'custom'],
    default: 'outfit'
  },
  colorTag: {
    type: String,
    enum: ['Blue', 'Green', 'Orange', 'Pink', 'Yellow', 'Purple', 'Red'],
    default: 'Blue'
  },
  
  // Validity Period
  validFrom: {
    type: Date,
    default: null
  },
  validTo: {
    type: Date,
    default: null
  },
  
  // Pricing
  offerPrice: {
    type: Number,
    required: true,
    min: [0, 'Offer price cannot be negative']
  },
  qtyProducts: {
    type: Number,
    required: true,
    min: [1, 'Quantity of products must be at least 1']
  },
  
  // Notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },
  
  // Rules Configuration
  rules: {
    allowMix: {
      type: Boolean,
      default: true
    },
    minItems: {
      type: Number,
      min: [0, 'Min items cannot be negative'],
      default: 0
    },
    maxItems: {
      type: Number,
      min: [0, 'Max items cannot be negative'],
      default: 0
    },
    slots: [{
      minPrice: {
        type: Number,
        required: true,
        min: [0, 'Min price cannot be negative']
      },
      maxPrice: {
        type: Number,
        required: true,
        min: [0, 'Max price cannot be negative']
      }
    }]
  },
  
  // Status
  paused: {
    type: Boolean,
    default: false
  },
  
  // System Fields
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We're managing createdAt manually
});

// Indexes for better performance
comboSchema.index({ sku: 1 });
comboSchema.index({ type: 1 });
comboSchema.index({ paused: 1 });
comboSchema.index({ validFrom: 1, validTo: 1 });

// Generate combo SKU
comboSchema.pre('save', async function(next) {
  if (this.isNew && (!this.sku || this.sku.trim() === '')) {
    try {
      // Find the highest existing SKU number
      const existingCombos = await this.constructor.find({ sku: { $regex: /^CMB-\d{4}$/ } })
        .sort({ sku: -1 })
        .limit(10);
      
      let maxNumber = 0;
      for (const combo of existingCombos) {
        const numberPart = parseInt(combo.sku.substring(4));
        if (!isNaN(numberPart) && numberPart > maxNumber) {
          maxNumber = numberPart;
        }
      }
      
      const nextNumber = maxNumber + 1;
      this.sku = `CMB-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating SKU:', error);
      // Fallback to random if database query fails
      const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      this.sku = `CMB-${seq}`;
    }
  }
  next();
});

// Method to check combo status
comboSchema.methods.getStatus = function() {
  if (this.paused) return 'paused';
  
  const today = new Date();
  const start = this.validFrom ? new Date(this.validFrom) : null;
  const end = this.validTo ? new Date(this.validTo) : null;
  
  if (start && today < start) return 'upcoming';
  if (end && today > end) return 'expired';
  
  return 'active';
};

// Method to compute slot bands for price calculations
comboSchema.methods.computeSlotBands = function() {
  const slots = this.rules?.slots || [];
  let minMRP = 0, maxMRP = 0;
  let totalQty = slots.length || 0;
  
  for (const slot of slots) {
    minMRP += slot.minPrice || 0;
    maxMRP += slot.maxPrice || 0;
  }
  
  const minAt15 = Math.round(minMRP * 0.85); // 15% discount assumption
  const maxAt15 = Math.round(maxMRP * 0.85);
  
  return { minMRP, maxMRP, minAt15, maxAt15, totalQty };
};

// Static method to get active combos
comboSchema.statics.getActiveCombos = function() {
  const now = new Date();
  return this.find({
    paused: false,
    $or: [
      { validFrom: { $lte: now } },
      { validFrom: { $exists: false } },
      { validFrom: null }
    ],
    $or: [
      { validTo: { $gte: now } },
      { validTo: { $exists: false } },
      { validTo: null }
    ]
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Combo', comboSchema);