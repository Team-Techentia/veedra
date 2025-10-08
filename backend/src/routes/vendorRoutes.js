const express = require('express');
const { protect, isManagerOrOwner } = require('../middleware/auth');
const {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorCommissions
} = require('../controllers/vendorController');

const router = express.Router();

// All routes protected and manager/owner only
router.use(protect);
router.use(isManagerOrOwner);

router.route('/')
  .get(getVendors)
  .post(createVendor);

router.route('/:id')
  .get(getVendor)
  .put(updateVendor)
  .delete(deleteVendor);

router.get('/:id/commissions', getVendorCommissions);

module.exports = router;