const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

// T-06: Seluruh rute laporan & analitik dashboard khusus untuk Administrator
router.use(verifyToken, requireAdmin);

router.get('/dashboard', reportController.getDashboardAnalytics);
router.get('/sales', reportController.getSalesReport);
router.get('/export/excel', reportController.exportSalesExcel);

module.exports = router;
