const express = require('express');
const { protect, canAccessBilling } = require('../middleware/auth');
const {
  createBill,
  getBills,
  getBill,
  updateBill,
  deleteBill,
  cancelBill,
  generateInvoice,
  getDailySales,
  getStaffSales,
  deleteOldBills
} = require('../controllers/billingController');

const router = express.Router();

// All routes protected and billing access required
router.use(protect);
router.use(canAccessBilling);

router.route('/')
  .get(getBills)
  .post(createBill);

router.delete('/cleanup', deleteOldBills);

router.route('/:id')
  .get(getBill)
  .put(updateBill)
  .delete(deleteBill);

router.route('/:id/cancel')
  .post(cancelBill);

router.get('/:id/invoice', generateInvoice);
router.get('/reports/daily', getDailySales);
router.get('/reports/download', getDailySales);
router.get('/reports/staff/:staffId', getStaffSales);

module.exports = router;