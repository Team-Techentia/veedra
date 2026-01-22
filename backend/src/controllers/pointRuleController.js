const PointRule = require('../models/PointRule');
const PointConfig = require('../models/PointConfig');
const asyncHandler = require('express-async-handler');

// @desc    Get all point rules
// @route   GET /api/point-rules
// @access  Private
const getRules = asyncHandler(async (req, res) => {
    let rules = await PointRule.find().sort({ minAmount: 1 });

    // Seed default rules if empty
    if (rules.length === 0) {
        const defaultRules = [
            { minAmount: 60, maxAmount: 200, points: 100 },
            { minAmount: 210, maxAmount: 350, points: 200 },
            { minAmount: 360, maxAmount: 500, points: 300 },
            { minAmount: 510, maxAmount: 700, points: 400 },
            { minAmount: 710, maxAmount: 1100, points: 500 },
            { minAmount: 1110, maxAmount: 999999, points: 600 }
        ];
        rules = await PointRule.insertMany(defaultRules);
        console.log('🌱 Seeded default point rules');
    }

    res.status(200).json({
        success: true,
        count: rules.length,
        data: rules
    });
});

// @desc    Update a point rule
// @route   PUT /api/point-rules/:id
// @access  Private (Admin/Manager)
const updateRule = asyncHandler(async (req, res) => {
    const { minAmount, maxAmount, points } = req.body;

    let rule = await PointRule.findById(req.params.id);

    if (!rule) {
        res.status(404);
        throw new Error('Point rule not found');
    }

    // Update fields
    const oldRule = { ...rule.toObject() };

    rule.minAmount = minAmount ?? rule.minAmount;
    rule.maxAmount = maxAmount ?? rule.maxAmount;
    rule.points = points ?? rule.points;

    const updatedRule = await rule.save();

    // Log changes as requested
    console.log('🔄 Point Rule Updated:');
    console.log(`   ID: ${updatedRule._id}`);
    console.log(`   Min: ${oldRule.minAmount} -> ${updatedRule.minAmount}`);
    console.log(`   Max: ${oldRule.maxAmount} -> ${updatedRule.maxAmount}`);
    console.log(`   Points: ${oldRule.points} -> ${updatedRule.points}`);

    res.status(200).json({
        success: true,
        data: updatedRule
    });
});

// @desc    Get point configuration (point price)
// @route   GET /api/point-rules/config/price
// @access  Private
const getPointConfig = asyncHandler(async (req, res) => {
    let config = await PointConfig.findOne();

    // Create default config if doesn't exist
    if (!config) {
        config = await PointConfig.create({ pointPrice: 1 });
        console.log('🔧 Created default point config: 1 point = ₹1');
    }

    res.status(200).json({
        success: true,
        data: config
    });
});

// @desc    Update point configuration
// @route   PUT /api/point-rules/config/price
// @access  Private
const updatePointConfig = asyncHandler(async (req, res) => {
    const { pointPrice } = req.body;

    if (!pointPrice || pointPrice <= 0) {
        res.status(400);
        throw new Error('Valid point price is required');
    }

    let config = await PointConfig.findOne();

    if (!config) {
        config = await PointConfig.create({ pointPrice });
    } else {
        config.pointPrice = pointPrice;
        await config.save();
    }

    console.log(`💰 Point Price Updated: 1 point = ₹${pointPrice}`);

    res.status(200).json({
        success: true,
        data: config
    });
});

module.exports = {
    getRules,
    updateRule,
    getPointConfig,
    updatePointConfig
};
