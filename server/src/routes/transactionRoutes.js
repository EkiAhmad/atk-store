const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middlewares/auth');

// T-06: Seluruh rute transaksi memerlukan token otentikasi
router.use(verifyToken);

// Kasir dan Admin dapat membuat checkout transaksi dan melihat detail nota
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
