const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const productController = require('../controllers/productController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

// T-06: Seluruh rute produk memerlukan token otentikasi
router.use(verifyToken);

// Template routes (dapat diunduh oleh semua pengguna terautentikasi)
router.get('/template', productController.downloadTemplate);
router.get('/template-csv', productController.downloadCsvTemplate);

// Export & Import routes (Khusus Administrator)
router.get('/export', requireAdmin, productController.exportProducts);
router.post('/import', requireAdmin, upload.single('file'), productController.importProducts);

// Standard product routes
// Kasir & Admin dapat membaca produk untuk pencarian barang & scanning barcode di POS
router.get('/', productController.getProducts);
router.get('/barcode/:barcode', productController.getProductByBarcode);
router.get('/:id', productController.getProductById);

// Penulisan produk, perubahan stok manual, dan penghapusan hanya untuk Administrator
router.post('/', requireAdmin, productController.createProduct);
router.put('/:id', requireAdmin, productController.updateProduct);
router.post('/:id/adjust-stock', requireAdmin, productController.adjustStock);
router.delete('/:id', requireAdmin, productController.deleteProduct);

module.exports = router;
