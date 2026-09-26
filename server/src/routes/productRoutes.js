const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const productController = require('../controllers/productController');

// Template & Export/Import routes (Placed before /:id to prevent route clash)
router.get('/template', productController.downloadTemplate);
router.get('/template-csv', productController.downloadCsvTemplate);
router.get('/export', productController.exportProducts);
router.post('/import', upload.single('file'), productController.importProducts);

// Standard product routes
router.get('/', productController.getProducts);
router.get('/barcode/:barcode', productController.getProductByBarcode);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.post('/:id/adjust-stock', productController.adjustStock);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
