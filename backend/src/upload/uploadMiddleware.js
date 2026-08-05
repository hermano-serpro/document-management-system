const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storageDirectory = path.join(__dirname, '../../storage');
const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);

if (!fs.existsSync(storageDirectory)) {
  fs.mkdirSync(storageDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, storageDirectory);
  },
  filename(req, file, callback) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
    callback(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxUploadBytes,
  },
});

module.exports = {
  upload,
  storageDirectory,
};