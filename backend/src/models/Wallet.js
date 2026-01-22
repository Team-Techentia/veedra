const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
    },
    customerName: {
        type: String,
        default: 'Customer'
    },
    points: {
        type: Number,
        default: 0,
        min: 0
    },
    transactions: [{
        type: {
            type: String,
            enum: ['earned', 'redeemed', 'adjustment'],
            required: true
        },
        points: {
            type: Number,
            required: true
        },
        billNumber: String,
        billAmount: Number,
        description: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
walletSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Wallet', walletSchema);
