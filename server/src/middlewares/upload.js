const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv',
    'application/csv',
    'text/plain',
  ];

  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Harap upload file Excel (.xlsx, .xls) atau CSV (.csv).'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

module.exports = upload;
