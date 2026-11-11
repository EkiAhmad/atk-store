const jwt = require('jsonwebtoken');

// T-06: Wajib menggunakan JWT_SECRET dari variabel lingkungan (.env) tanpa fallback hardcoded
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: Variabel lingkungan JWT_SECRET wajib dikonfigurasi dalam file .env');
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to verify JWT token in Authorization: Bearer <token> or query ?token=
 */
function verifyToken(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    // Mendukung unduhan file langsung dari tautan browser via parameter query token
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token otentikasi tidak ditemukan.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, name, role }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Sesi telah berakhir atau token tidak valid. Silakan login kembali.',
    });
  }
}

/**
 * Middleware to require ADMIN role
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Fitur ini hanya dapat diakses oleh Administrator.',
    });
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
  JWT_SECRET,
};
