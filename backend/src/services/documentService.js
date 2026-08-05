const { randomUUID } = require('crypto');
const fs = require('fs');

function createError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function toPublicDocumentModel(documentRecord) {
  return {
    id: documentRecord.id,
    originalName: documentRecord.originalName,
    filename: documentRecord.filename,
    mimeType: documentRecord.mimeType,
    size: documentRecord.size,
    storagePath: documentRecord.storagePath,
    uploadedAt: documentRecord.uploadedAt,
    owner: documentRecord.owner,
  };
}

function createDocumentService({ documentRepository }) {
  function createDocument({ file, owner }) {
    if (!file) {
      throw createError(400, 'VALIDATION_ERROR', 'Arquivo e owner são obrigatórios');
    }

    const normalizedOwner = typeof owner === 'string' ? owner.trim() : '';

    if (!normalizedOwner) {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw createError(400, 'VALIDATION_ERROR', 'Arquivo e owner são obrigatórios');
    }

    const now = new Date().toISOString();
    const documentRecord = {
      id: randomUUID(),
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: `storage/${file.filename}`,
      uploadedAt: now,
      owner: normalizedOwner,
      localPath: file.path,
    };

    documentRepository.create(documentRecord);

    return toPublicDocumentModel(documentRecord);
  }

  function listDocuments({ owner }) {
    const normalizedOwner = typeof owner === 'string' ? owner.trim() : '';
    const documents = documentRepository.findAll({ owner: normalizedOwner || undefined });

    return documents.map(toPublicDocumentModel);
  }

  function getDownloadDocumentById(id) {
    const documentRecord = documentRepository.findById(id);

    if (!documentRecord) {
      throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
    }

    if (!fs.existsSync(documentRecord.localPath)) {
      throw createError(410, 'DOCUMENT_FILE_MISSING', 'Arquivo do documento não está mais disponível');
    }

    return {
      metadata: toPublicDocumentModel(documentRecord),
      localPath: documentRecord.localPath,
    };
  }

  return {
    createDocument,
    listDocuments,
    getDownloadDocumentById,
  };
}

module.exports = {
  createDocumentService,
};