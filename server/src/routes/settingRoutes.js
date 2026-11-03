const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

// T-06: Seluruh rute pengaturan toko memerlukan otentikasi
router.use(verifyToken);

// Kasir & Admin membaca pengaturan toko untuk cetak struk nota & header
router.get('/', settingController.getSettings);

// Perubahan pengaturan toko hanya untuk Administrator
router.put('/', requireAdmin, settingController.updateSettings);

module.exports = router;
