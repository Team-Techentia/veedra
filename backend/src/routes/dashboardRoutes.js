const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getOwnerDashboard,
  getManagerDashboard,
  getStaffDashboard
} = require('../controllers/dashboardController');

const router = express.Router();

// All routes protected
router.use(protect);

router.get('/owner', authorize('owner'), getOwnerDashboard);
router.get('/manager', authorize('owner', 'manager'), getManagerDashboard);
router.get('/staff', getStaffDashboard);

module.exports = router;