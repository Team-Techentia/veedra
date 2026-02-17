const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getWalletByPhone,
    calculatePointsEarned,
    calculatePointsPerProduct,
    updateWalletPoints,
    getAllCustomers,
    updateCustomer,
    deleteCustomer,
    getTopLoyaltyHolders,
    getCustomerBills,
    adjustPoints,
    expireOldPoints,
    // Point Rules
    getPointRules,
    addPointRule,
    updatePointRule,
    deletePointRule
} = require('../controllers/walletController');

// Get wallet by phone number
router.get('/phone/:phone', protect, getWalletByPhone);

// Calculate points for a bill amount
router.post('/calculate-points', protect, calculatePointsEarned);

// Calculate points per product
router.post('/calculate-points-per-product', protect, calculatePointsPerProduct);

// Update wallet points (earn/redeem)
router.post('/update', protect, updateWalletPoints);

// === Point Rules Management ===
// Get all point rules
router.get('/rules', protect, getPointRules);

// Add a point rule
router.post('/rules', protect, addPointRule);

// Update a point rule
router.put('/rules/:id', protect, updatePointRule);

// Delete a point rule
router.delete('/rules/:id', protect, deletePointRule);

// === User Management Routes ===

// Get all customers with pagination and search
router.get('/customers', protect, getAllCustomers);

// Get top loyalty holders
router.get('/top-loyalty', protect, getTopLoyaltyHolders);

// Get customer bills
router.get('/:id/bills', protect, getCustomerBills);

// Update customer details
router.put('/:id', protect, updateCustomer);

// Delete customer
router.delete('/:id', protect, deleteCustomer);

// Manually adjust customer points
router.post('/:id/adjust-points', protect, adjustPoints);

// Expire old points (background job)
router.post('/expire-old-points', protect, expireOldPoints);

module.exports = router;
