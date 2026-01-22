const mongoose = require('mongoose');

const pointRuleSchema = new mongoose.Schema({
    minAmount: {
        type: Number,
        required: [true, 'Minimum amount is required'],
        min: 0
    },
    maxAmount: {
        type: Number,
        required: [true, 'Maximum amount is required'],
        min: 0
    },
    points: {
        type: Number,
        required: [true, 'Points are required'],
        min: 0
    },
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
pointRuleSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('PointRule', pointRuleSchema);
