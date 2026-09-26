const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/dashboard', reportController.getDashboardAnalytics);
router.get('/sales', reportController.getSalesReport);
router.get('/export/excel', reportController.exportSalesExcel);

module.exports = router;
