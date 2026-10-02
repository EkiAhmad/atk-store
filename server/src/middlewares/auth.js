const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'atk-pos-secret-key-2026-secure';

/**
 * Middleware to verify JWT token in Authorization: Bearer <token>
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token otentikasi tidak ditemukan.',
    });
  }

  const token = authHeader.split(' ')[1];

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
