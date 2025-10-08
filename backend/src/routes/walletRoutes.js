const express = require('express');
const { protect, isOwner } = require('../middleware/auth');
const {
  getWallets,
  getWallet,
  getWalletTransactions,
  processCommissionPayout,
  adjustWalletBalance
} = require('../controllers/walletController');

const router = express.Router();

// All routes protected
router.use(protect);

router.get('/', getWallets);
router.get('/:id', getWallet);
router.get('/:id/transactions', getWalletTransactions);

// Owner only routes
router.post('/:id/payout', isOwner, processCommissionPayout);
router.post('/:id/adjust', isOwner, adjustWalletBalance);

module.exports = router;