const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Store files to disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to allow only images and videos
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
  ];

  console.log(`[MULTER] Processing file: ${file.originalname}, MIME: ${file.mimetype}`);

  if (allowedMimes.includes(file.mimetype)) {
    console.log(`[MULTER] ✓ File accepted: ${file.originalname}`);
    cb(null, true);
  } else {
    console.log(`[MULTER] ✗ File rejected: ${file.originalname} (invalid MIME type)`);
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 10, // Max 10 files
  },
});

// Middleware to handle multer errors
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`[MULTER ERROR] ${err.code}: ${err.message}`);
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 100MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 10' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    console.error(`[UPLOAD ERROR] ${err.message}`);
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = { upload, uploadErrorHandler };
