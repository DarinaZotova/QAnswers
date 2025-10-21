// backend/middlewares/upload.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const AVATARS_DIR = path.join(ROOT, UPLOADS_DIR, 'avatars');
fs.mkdirSync(AVATARS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `u${req.user.id}_${Date.now()}${ext || ''}`);
  }
});
const fileFilter = (req, file, cb) => {
  cb(null, /image\/(png|jpe?g|gif|webp)/i.test(file.mimetype));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
