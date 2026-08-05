const express = require('express');
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/documentController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../storage'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), controller.upload);
router.get('/documents', controller.list);
router.get('/documents/:id/download', controller.download);

module.exports = router;
