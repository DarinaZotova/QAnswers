// backend/middlewares/postImages.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const ROOT = process.cwd();
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const POST_IMAGES_DIR = path.join(ROOT, UPLOADS_DIR, 'post-images');

fs.mkdirSync(POST_IMAGES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, POST_IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `p${req.user.id}_${Date.now()}_${randomUUID()}${ext || ''}`);
  }
});

const fileFilter = (req, file, cb) => {
  cb(null, /image\/(png|jpe?g|gif|webp)/i.test(file.mimetype));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
