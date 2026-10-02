const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console and general logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
  })
);

// General Application Logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [
    // General app logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5 * 1024 * 1024, // 5MB per file
      maxFiles: 5,
    }),
    // Error only logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level}: ${message}${metaStr}`;
        })
      ),
    })
  );
}

// Dedicated Transaction Logger (Writes strictly to server/logs/transactions.log)
const transactionLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` | Meta: ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${message}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'transactions.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
  ],
});

/**
 * Log a completed checkout transaction event
 */
function logTransaction(tx) {
  const itemsSummary = tx.items
    ? tx.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')
    : 'No items';

  const logMessage = `TRANSAKSI BERHASIL: [${tx.invoiceNumber}] | Kasir: "${tx.cashierName}" | Total: Rp ${Number(tx.finalAmount).toLocaleString('id-ID')} | Metode: ${tx.paymentMethod} | Item (${tx.items?.length || 0} jenis): ${itemsSummary}`;

  transactionLogger.info(logMessage);
  logger.info(`[Checkout] ${tx.invoiceNumber} processed by ${tx.cashierName}`);
}

/**
 * Log user and system activities (Login, Import, Restock, CRUD)
 */
function logActivity(action, details, user = null) {
  const username = user ? user.username || user : 'SYSTEM';
  const role = user?.role ? ` [${user.role}]` : '';
  const message = `[AKTIVITAS] User: ${username}${role} | Aksi: ${action} | Detail: ${typeof details === 'object' ? JSON.stringify(details) : details}`;
  logger.info(message);
}

module.exports = {
  logger,
  logTransaction,
  logActivity,
};
