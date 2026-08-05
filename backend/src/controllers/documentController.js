function createDocumentController({ documentService }) {
  async function uploadDocument(req, res, next) {
    try {
      const document = documentService.createDocument({
        file: req.file,
        owner: req.body.owner,
      });

      return res.status(201).json(document);
    } catch (error) {
      return next(error);
    }
  }

  async function listDocuments(req, res, next) {
    try {
      const items = documentService.listDocuments({
        owner: req.query.owner,
      });

      return res.status(200).json({
        items,
        total: items.length,
      });
    } catch (error) {
      return next(error);
    }
  }

  async function downloadDocument(req, res, next) {
    try {
      const result = documentService.getDownloadDocumentById(req.params.id);

      res.setHeader('Content-Type', result.metadata.mimeType);
      return res.download(result.localPath, result.metadata.originalName);
    } catch (error) {
      return next(error);
    }
  }

  return {
    uploadDocument,
    listDocuments,
    downloadDocument,
  };
}

module.exports = {
  createDocumentController,
};