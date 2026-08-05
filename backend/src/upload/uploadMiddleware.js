const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storageDirectory = path.join(__dirname, '../../storage');
const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const DEFAULT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/json',
  'application/xml',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text',
  'application/msword',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/csv',
];

function parseMaxUploadBytes(value) {
  if (!value || !String(value).trim()) {
    return DEFAULT_MAX_UPLOAD_BYTES;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('MAX_UPLOAD_BYTES deve ser um inteiro positivo');
  }

  return parsed;
}

function parseAllowedMimeTypes(value) {
  if (!value || !String(value).trim()) {
    return new Set(DEFAULT_ALLOWED_MIME_TYPES);
  }

  const configuredTypes = String(value)
    .split(',')
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);

  if (!configuredTypes.length) {
    throw new Error('ALLOWED_UPLOAD_MIME_TYPES deve conter ao menos um MIME type válido');
  }

  return new Set(configuredTypes);
}

const maxUploadBytes = parseMaxUploadBytes(process.env.MAX_UPLOAD_BYTES);
const allowedMimeTypes = parseAllowedMimeTypes(process.env.ALLOWED_UPLOAD_MIME_TYPES);

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
  fileFilter(req, file, callback) {
    const mimeType = String(file.mimetype || '').toLowerCase();

    if (!allowedMimeTypes.has(mimeType)) {
      const error = new Error('Tipo de arquivo não permitido');
      error.status = 400;
      error.code = 'UNSUPPORTED_MEDIA_TYPE';
      callback(error);
      return;
    }

    callback(null, true);
  },
});

module.exports = {
  upload,
  storageDirectory,
};