const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getSalesReport,
  getInventoryReport,
  getCommissionReport,
  getProductPerformance,
  exportReport
} = require('../controllers/reportController');

const router = express.Router();

// All routes protected
router.use(protect);

router.get('/sales', getSalesReport);
router.get('/inventory', authorize('owner', 'manager'), getInventoryReport);
router.get('/commission', authorize('owner', 'manager'), getCommissionReport);
router.get('/products', getProductPerformance);
router.post('/export', exportReport);

module.exports = router;