const express = require('express');
const router = express.Router();
const { processPayment, getPaymentHistory } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Process payment
router.post('/', protect, processPayment);

// Get payment history
router.get('/history', protect, getPaymentHistory);

module.exports = router;