const service = require('../services/documentService');

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }
  const doc = service.saveDocument(req.file);
  return res.status(201).json(doc);
}

function list(req, res) {
  const docs = service.listDocuments();
  return res.json(docs);
}

function download(req, res) {
  const doc = service.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }
  return res.download(doc.path, doc.originalName);
}

module.exports = { upload, list, download };
