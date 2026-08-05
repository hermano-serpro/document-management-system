const express = require('express');

function createDocumentRoutes({ documentController, upload }) {
  const router = express.Router();

  router.post('/upload', upload.single('file'), documentController.uploadDocument);
  router.get('/documents', documentController.listDocuments);
  router.get('/documents/:id/download', documentController.downloadDocument);

  return router;
}

module.exports = {
  createDocumentRoutes,
};