const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { JWT_SECRET } = require('../middlewares/auth');
const { logActivity, logger } = require('../utils/logger');

// Login User (Admin / Kasir)
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi.',
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (!user || !user.isActive) {
      logActivity('LOGIN_FAILED', { reason: 'User tidak ditemukan atau nonaktif', username: cleanUsername });
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logActivity('LOGIN_FAILED', { reason: 'Password salah', username: cleanUsername });
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    // Generate JWT token (valid for 24 hours)
    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    logActivity('LOGIN_SUCCESS', { name: user.name }, user);

    res.json({
      success: true,
      message: `Selamat datang, ${user.name}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Get Current Logged-in User Profile
async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  getMe,
};
