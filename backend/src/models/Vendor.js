const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Please add shop name'],
    trim: true,
    maxlength: [100, 'Shop name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  city: {
    type: String,
    required: [true, 'Please add city'],
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  rating: {
    type: String,
    enum: ['⭐️', '⭐️⭐️', '⭐️⭐️⭐️', '⭐️⭐️⭐️⭐️', '⭐️⭐️⭐️⭐️⭐️'],
    default: '⭐️'
  },
  
  // Factory Info
  hasFactory: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  factoryLocation: {
    type: String,
    trim: true
  },
  factoryDistance: {
    type: String,
    trim: true
  },
  
  // Personal Info
  dob: {
    type: Date
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative']
  },
  
  // Production Info
  stitchMachines: {
    type: Number,
    min: [0, 'Number of machines cannot be negative']
  },
  productionPerDay: {
    type: Number,
    min: [0, 'Production per day cannot be negative']
  },
  variationType: {
    type: String,
    enum: ['1_size_diff_colors', 'diff_sizes_1_color', 'both_size_and_color'],
    default: '1_size_diff_colors'
  },
  minOrderQuantity: {
    type: Number,
    min: [0, 'Minimum order quantity cannot be negative']
  },
  canReplaceUnsold: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  
  // Contact Details
  ownerName: {
    type: String,
    required: [true, 'Please add owner name'],
    trim: true
  },
  ownerMobile: {
    type: String,
    required: [true, 'Please add owner mobile number'],
    match: [/^[6-9]\d{9}$/, 'Please enter valid mobile number']
  },
  orderPerson1: {
    type: String,
    required: [true, 'Please add order person 1 name'],
    trim: true
  },
  orderMobile1: {
    type: String,
    required: [true, 'Please add order person 1 mobile number'],
    match: [/^[6-9]\d{9}$/, 'Please enter valid mobile number']
  },
  orderPerson2: {
    type: String,
    trim: true
  },
  orderMobile2: {
    type: String,
    match: [/^[6-9]\d{9}$/, 'Please enter valid mobile number']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  
  // Tax & Compliance
  gstNumber: {
    type: String,
    uppercase: true,
    trim: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter valid GST number']
  },
  panNumber: {
    type: String,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter valid PAN number']
  },
  
  // Categories & Specialties
  specialties: [{
    category: {
      type: String,
      required: true
    },
    prices: [{
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    }]
  }],
  categories: [{
    type: String
  }],
  
  // Images
  shopImages: [{
    type: String // Base64 encoded images or URLs
  }],
  
  // Performance & Notes
  performanceScore: {
    type: Number,
    min: [0, 'Performance score cannot be negative'],
    max: [100, 'Performance score cannot exceed 100'],
    default: 0
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  
  // Commission & Financial
  commissionRate: {
    type: Number,
    min: [0, 'Commission rate cannot be negative'],
    max: [100, 'Commission rate cannot exceed 100%'],
    default: 5
  },
  paymentTerms: {
    type: String,
    enum: ['immediate', '15days', '30days', '45days', '60days'],
    default: '30days'
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  totalCommissionEarned: {
    type: Number,
    default: 0,
    min: [0, 'Total commission cannot be negative']
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: [0, 'Wallet balance cannot be negative']
  },
  totalOrderValue: {
    type: Number,
    default: 0,
    min: [0, 'Total order value cannot be negative']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance
vendorSchema.index({ code: 1 });
vendorSchema.index({ name: 1 });
vendorSchema.index({ 'contact.phone': 1 });
vendorSchema.index({ isActive: 1 });

// Generate vendor code
vendorSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    // Ensure name and city exist before generating code
    if (!this.name || !this.city) {
      return next(new Error('Name and city are required to generate vendor code'));
    }
    
    const namePart = this.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    const cityPart = this.city.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    this.code = `V${namePart}${cityPart}${timestamp}`;
  }
  next();
});

// Virtual for commission balance
vendorSchema.virtual('commissionBalance').get(function() {
  return this.totalCommissionEarned;
});

// Ensure virtual fields are serialized
vendorSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Vendor', vendorSchema);