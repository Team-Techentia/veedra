const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Bill Type - Key Feature for E-commerce
  billType: {
    type: String,
    enum: ['normal', 'combo', 'mixed'],
    required: true,
    default: 'normal'
  },
  
  // Customer Information
  customer: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter valid phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter valid email']
    },
    address: {
      type: String,
      trim: true
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true
    }
  },
  
  // Product Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    productCode: {
      type: String,
      required: true
    },
    barcode: {
      type: String
    },
    hsnCode: {
      type: String
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unit: {
      type: String,
      default: 'piece'
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    mrp: {
      type: Number,
      required: true,
      min: [0, 'MRP cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    taxRate: {
      type: Number,
      enum: [0, 5, 12, 18, 28],
      default: 18
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    },
    
    // Combo Assignment Info
    comboAssignment: {
      comboId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combo'
      },
      slotName: {
        type: String
      },
      slotPrice: {
        type: Number
      },
      isComboItem: {
        type: Boolean,
        default: false
      }
    }
  }],
  
  // Applied Combos - Track multiple combos in mixed billing
  appliedCombos: [{
    combo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Combo',
      required: true
    },
    comboName: {
      type: String,
      required: true
    },
    comboCode: {
      type: String,
      required: true
    },
    originalAmount: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      required: true
    },
    finalAmount: {
      type: Number,
      required: true
    },
    savingsAmount: {
      type: Number,
      required: true
    },
    itemsCount: {
      type: Number,
      required: true
    },
    
    // Slot-wise breakdown
    slotBreakdown: [{
      slotName: String,
      itemsCount: Number,
      totalValue: Number
    }]
  }],
  
  // Bill Totals
  totals: {
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    totalDiscount: {
      type: Number,
      default: 0
    },
    comboSavings: {
      type: Number,
      default: 0
    },
    taxableAmount: {
      type: Number,
      default: 0
    },
    totalTax: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0
    },
    roundOff: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true,
      default: 0
    }
  },
  
  // Tax Breakdown (GST)
  taxBreakdown: [{
    taxRate: {
      type: Number,
      required: true
    },
    taxableAmount: {
      type: Number,
      required: true
    },
    cgst: {
      type: Number,
      default: 0
    },
    sgst: {
      type: Number,
      default: 0
    },
    igst: {
      type: Number,
      default: 0
    },
    totalTax: {
      type: Number,
      required: true
    }
  }],
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'netbanking', 'wallet', 'credit'],
      required: true,
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded'],
      default: 'paid'
    },
    amountReceived: {
      type: Number,
      required: true,
      default: 0
    },
    changeGiven: {
      type: Number,
      default: 0
    },
    transactionId: {
      type: String,
      trim: true
    },
    reference: {
      type: String,
      trim: true
    }
  },
  
  // Commission Tracking
  commissions: {
    vendor: [{
      vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
      },
      vendorName: String,
      totalSales: Number,
      commissionRate: Number,
      commissionAmount: Number
    }],
    staff: {
      staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      staffName: String,
      commissionRate: Number,
      commissionAmount: Number
    }
  },
  
  // Bill Status and Metadata
  status: {
    type: String,
    enum: ['draft', 'completed', 'cancelled', 'returned'],
    default: 'completed'
  },
  
  // Billing Staff
  billedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  billerName: {
    type: String,
    required: true
  },
  
  // Store/Branch Information
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  branchName: {
    type: String,
    default: 'Main Store'
  },
  
  // Additional Information
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Return/Exchange Information
  returnInfo: {
    isReturn: {
      type: Boolean,
      default: false
    },
    originalBillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Billing'
    },
    returnReason: String,
    returnAmount: {
      type: Number,
      default: 0
    }
  },
  
  // Printing and Export
  printInfo: {
    printCount: {
      type: Number,
      default: 0
    },
    lastPrintedAt: Date,
    printedBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      printedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // System Fields
  billDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Analytics flags
  analytics: {
    isComboSale: {
      type: Boolean,
      default: false
    },
    hasMixedItems: {
      type: Boolean,
      default: false
    },
    totalItems: {
      type: Number,
      default: 0
    },
    averageItemValue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
billingSchema.index({ billNumber: 1 });
billingSchema.index({ billDate: -1 });
billingSchema.index({ billType: 1 });
billingSchema.index({ status: 1 });
billingSchema.index({ billedBy: 1 });
billingSchema.index({ 'customer.phone': 1 });
billingSchema.index({ 'customer.email': 1 });
billingSchema.index({ 'totals.grandTotal': -1 });
billingSchema.index({ createdAt: -1 });

// Generate bill number
billingSchema.pre('save', async function(next) {
  if (this.isNew && !this.billNumber) {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    // Find the last bill number for today
    const lastBill = await this.constructor.findOne({
      billNumber: new RegExp(`^BILL${year}${month}${day}`),
      billDate: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    }).sort({ billNumber: -1 });
    
    let sequence = 1;
    if (lastBill) {
      const lastSequence = parseInt(lastBill.billNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.billNumber = `BILL${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
billingSchema.pre('save', function(next) {
  // Calculate subtotal
  this.totals.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.unitPrice * item.quantity);
  }, 0);
  
  // Calculate total discount
  this.totals.totalDiscount = this.items.reduce((sum, item) => {
    return sum + (item.discount * item.quantity);
  }, 0);
  
  // Calculate combo savings
  this.totals.comboSavings = this.appliedCombos.reduce((sum, combo) => {
    return sum + combo.savingsAmount;
  }, 0);
  
  // Calculate taxable amount
  this.totals.taxableAmount = this.totals.subtotal - this.totals.totalDiscount - this.totals.comboSavings;
  
  // Calculate total tax
  this.totals.totalTax = this.items.reduce((sum, item) => {
    return sum + item.taxAmount;
  }, 0);
  
  // Calculate grand total
  this.totals.grandTotal = this.totals.taxableAmount + this.totals.totalTax;
  
  // Apply round off
  this.totals.roundOff = Math.round(this.totals.grandTotal) - this.totals.grandTotal;
  this.totals.finalAmount = Math.round(this.totals.grandTotal);
  
  // Update analytics
  this.analytics.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.analytics.averageItemValue = this.analytics.totalItems > 0 ? 
    this.totals.subtotal / this.analytics.totalItems : 0;
  this.analytics.isComboSale = this.appliedCombos.length > 0;
  this.analytics.hasMixedItems = this.items.some(item => item.comboAssignment.isComboItem) && 
    this.items.some(item => !item.comboAssignment.isComboItem);
  
  next();
});

// Virtual for total savings
billingSchema.virtual('totalSavings').get(function() {
  return this.totals.totalDiscount + this.totals.comboSavings;
});

// Virtual for profit calculation
billingSchema.virtual('totalProfit').get(function() {
  // This would require product cost prices to calculate actual profit
  return 0; // Placeholder
});

// Method to add combo to bill
billingSchema.methods.addCombo = function(combo, items) {
  const comboData = {
    combo: combo._id,
    comboName: combo.name,
    comboCode: combo.code,
    originalAmount: items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
    itemsCount: items.length,
    slotBreakdown: []
  };
  
  // Calculate combo discount
  comboData.discountAmount = combo.calculateDiscount(comboData.originalAmount, items);
  comboData.finalAmount = comboData.originalAmount - comboData.discountAmount;
  comboData.savingsAmount = comboData.discountAmount;
  
  // Create slot breakdown
  const slotGroups = {};
  items.forEach(item => {
    const slot = item.comboAssignment.slotName;
    if (!slotGroups[slot]) {
      slotGroups[slot] = { itemsCount: 0, totalValue: 0 };
    }
    slotGroups[slot].itemsCount += item.quantity;
    slotGroups[slot].totalValue += (item.unitPrice * item.quantity);
  });
  
  comboData.slotBreakdown = Object.entries(slotGroups).map(([slotName, data]) => ({
    slotName,
    itemsCount: data.itemsCount,
    totalValue: data.totalValue
  }));
  
  this.appliedCombos.push(comboData);
  this.billType = this.items.some(item => !item.comboAssignment.isComboItem) ? 'mixed' : 'combo';
};

// Static method for daily sales report
billingSchema.statics.getDailySales = function(date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        billDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalBills: { $sum: 1 },
        totalAmount: { $sum: '$totals.finalAmount' },
        totalItems: { $sum: '$analytics.totalItems' },
        totalSavings: { $sum: { $add: ['$totals.totalDiscount', '$totals.comboSavings'] } },
        comboSales: {
          $sum: {
            $cond: [{ $eq: ['$analytics.isComboSale', true] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Static method for product-wise sales
billingSchema.statics.getProductSales = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        billDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.productName' },
        productCode: { $first: '$items.productCode' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalAmount' },
        averagePrice: { $avg: '$items.unitPrice' },
        salesCount: { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);
};

module.exports = mongoose.model('Billing', billingSchema);