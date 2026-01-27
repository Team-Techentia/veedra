const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getWalletByPhone,
    calculatePointsEarned,
    calculatePointsPerProduct,
    updateWalletPoints
} = require('../controllers/walletController');

// Get wallet by phone number
router.get('/phone/:phone', protect, getWalletByPhone);

// Calculate points for a bill amount
router.post('/calculate-points', protect, calculatePointsEarned);

// Calculate points per product
router.post('/calculate-points-per-product', protect, calculatePointsPerProduct);

// Update wallet points (earn/redeem)
router.post('/update', protect, updateWalletPoints);

module.exports = router;
