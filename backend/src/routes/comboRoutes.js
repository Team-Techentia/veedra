const express = require('express');
const { protect, isManagerOrOwner, canAccessBilling } = require('../middleware/auth');
const {
  getCombos,
  getCombo,
  createCombo,
  updateCombo,
  deleteCombo,
  getActiveCombos,
  validateComboForProducts,
  getComboStats
} = require('../controllers/comboController');

const router = express.Router();

// All routes protected
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getCombos);
router.get('/active', getActiveCombos);
router.get('/stats', getComboStats);
router.get('/:id', getCombo);
router.post('/validate', canAccessBilling, validateComboForProducts);

// Manager/Owner only routes
router.post('/', isManagerOrOwner, createCombo);
router.put('/:id', isManagerOrOwner, updateCombo);
router.delete('/:id', isManagerOrOwner, deleteCombo);

module.exports = router;