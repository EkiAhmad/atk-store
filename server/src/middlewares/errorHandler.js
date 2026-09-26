function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target || 'field';
    return res.status(400).json({
      success: false,
      message: `Data dengan ${Array.isArray(fields) ? fields.join(', ') : fields} ini sudah terdaftar.`,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Data tidak ditemukan di database.',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
