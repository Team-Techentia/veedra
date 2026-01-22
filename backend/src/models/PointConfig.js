const mongoose = require('mongoose');

const pointConfigSchema = new mongoose.Schema({
    pointPrice: {
        type: Number,
        required: true,
        default: 1,
        min: 0.01
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
pointConfigSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('PointConfig', pointConfigSchema);
