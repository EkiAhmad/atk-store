const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

// T-06: Seluruh rute kategori wajib diautentikasi
router.use(verifyToken);

// Kasir & Admin dapat melihat kategori untuk transaksi/katalog
router.get('/', categoryController.getCategories);

// Mutasi kategori hanya untuk Admin
router.post('/', requireAdmin, categoryController.createCategory);
router.put('/:id', requireAdmin, categoryController.updateCategory);
router.delete('/:id', requireAdmin, categoryController.deleteCategory);

module.exports = router;
