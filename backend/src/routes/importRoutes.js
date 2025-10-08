const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { upload, getImportTemplate, importProducts } = require('../controllers/importController');

const router = express.Router();

// All routes protected
router.use(protect);
router.use(authorize('owner', 'manager'));

// Import template
router.get('/template', getImportTemplate);

// Import products
router.post('/products', upload.single('file'), importProducts);

module.exports = router;