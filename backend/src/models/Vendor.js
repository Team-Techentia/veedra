const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add vendor name'],
    trim: true,
    maxlength: [100, 'Vendor name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^VEN[0-9]{6}$/, 'Vendor code must be in format VEN123456']
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Please add phone number'],
      maxlength: [15, 'Phone number cannot be more than 15 characters']
    },
    email: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      }
    }
  },
  commissionRate: {
    type: Number,
    required: [true, 'Please add commission rate'],
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
  gstNumber: {
    type: String,
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter valid GST number']
  },
  panNumber: {
    type: String,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter valid PAN number']
  },
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
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
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
    const timestamp = Date.now().toString().slice(-6);
    this.code = `VEN${timestamp}`;
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