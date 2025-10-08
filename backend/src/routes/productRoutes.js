const express = require('express');
const { protect, isManagerOrOwner, canAccessBilling } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
  searchProducts,
  getLowStockProducts,
  generateBarcode,
  generateBundleBarcodes,
  getBundleSummary,
  createChildProducts,
  getBundles,
  scanProductByBarcode,
  getComboEligibleProducts
} = require('../controllers/productController');

const router = express.Router();

// All routes protected
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getProducts);
router.get('/search', canAccessBilling, searchProducts);
router.get('/bundles', getBundles);
router.get('/combo-eligible', canAccessBilling, getComboEligibleProducts);
router.get('/low-stock', isManagerOrOwner, getLowStockProducts);
router.get('/scan/:barcode', canAccessBilling, scanProductByBarcode);
router.get('/:id', getProduct);
router.get('/:id/barcode', generateBarcode);
router.get('/:id/bundle-barcodes', generateBundleBarcodes);
router.get('/:id/bundle-summary', getBundleSummary);

// Manager/Owner only routes
router.post('/', isManagerOrOwner, createProduct);
router.post('/bulk', isManagerOrOwner, bulkCreateProducts);
router.post('/:id/create-children', isManagerOrOwner, createChildProducts);
router.put('/:id', isManagerOrOwner, updateProduct);
router.delete('/:id', isManagerOrOwner, deleteProduct);

module.exports = router;