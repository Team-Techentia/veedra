const express = require('express');
const router = express.Router();
const { getRules, updateRule, getPointConfig, updatePointConfig } = require('../controllers/pointRuleController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getRules);

router.route('/:id')
    .put(protect, updateRule);

// Point config routes - MUST come before /:id route
router.route('/config/price')
    .get(protect, getPointConfig)
    .put(protect, updatePointConfig);

module.exports = router;
