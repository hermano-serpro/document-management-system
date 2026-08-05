const fs = require('fs');
const repository = require('../repositories/documentRepository');

function saveDocument({ originalname, filename, size, path: filePath }) {
  return repository.save({
    originalName: originalname,
    filename,
    size,
    path: filePath,
    uploadedAt: new Date().toISOString(),
  });
}

function listDocuments() {
  return repository.findAll();
}

function getDocumentById(id) {
  return repository.findById(id);
}

module.exports = { saveDocument, listDocuments, getDocumentById };
