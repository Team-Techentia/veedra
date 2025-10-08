const express = require('express');
const { protect, isManagerOrOwner } = require('../middleware/auth');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree
} = require('../controllers/categoryController');

const router = express.Router();

// All routes protected
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategory);

// Manager/Owner only routes
router.post('/', isManagerOrOwner, createCategory);
router.put('/:id', isManagerOrOwner, updateCategory);
router.delete('/:id', isManagerOrOwner, deleteCategory);

module.exports = router;