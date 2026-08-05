function createDocumentController({ documentService }) {
  function readRequesterOwner(req) {
    return req.header('x-owner-id') || '';
  }

  async function uploadDocument(req, res, next) {
    try {
      const document = await documentService.createDocument({
        file: req.file,
        owner: req.body.owner,
        requesterOwner: readRequesterOwner(req),
      });

      return res.status(201).json(document);
    } catch (error) {
      return next(error);
    }
  }

  async function listDocuments(req, res, next) {
    try {
      const items = documentService.listDocuments({
        requesterOwner: readRequesterOwner(req),
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
      const result = await documentService.getDownloadDocumentById(
        req.params.id,
        readRequesterOwner(req)
      );

      res.setHeader('Content-Type', result.metadata.mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
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