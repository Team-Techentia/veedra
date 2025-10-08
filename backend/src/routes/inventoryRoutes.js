const express = require('express');
const { protect, isManagerOrOwner } = require('../middleware/auth');
const {
  getInventory,
  adjustStock,
  getStockMovements,
  bulkStockAdjustment,
  getInventoryReport
} = require('../controllers/inventoryController');

const router = express.Router();

// All routes protected and manager/owner only
router.use(protect);
router.use(isManagerOrOwner);

router.get('/', getInventory);
router.post('/adjust', adjustStock);
router.post('/bulk-adjust', bulkStockAdjustment);
router.get('/movements', getStockMovements);
router.get('/report', getInventoryReport);

module.exports = router;