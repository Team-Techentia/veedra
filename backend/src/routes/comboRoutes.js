const express = require('express');
const { protect, isManagerOrOwner, canAccessBilling } = require('../middleware/auth');
const {
  getCombos,
  getCombo,
  createCombo,
  updateCombo,
  deleteCombo,
  toggleComboStatus,
  validateComboSlot
} = require('../controllers/comboController');

const router = express.Router();

// All routes protected
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getCombos);
router.get('/:id', getCombo);
router.post('/validate-slot', canAccessBilling, validateComboSlot);

// Manager/Owner only routes
router.post('/', isManagerOrOwner, createCombo);
router.put('/:id', isManagerOrOwner, updateCombo);
router.put('/:id/toggle-status', isManagerOrOwner, toggleComboStatus);
router.delete('/:id', isManagerOrOwner, deleteCombo);

module.exports = router;