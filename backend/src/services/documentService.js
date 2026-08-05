const { randomUUID } = require('crypto');

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
    mimeType: documentRecord.mimeType,
    size: documentRecord.size,
    uploadedAt: documentRecord.uploadedAt,
    owner: documentRecord.owner,
  };
}

function createDocumentService({ documentRepository, storageRepository }) {
  async function createDocument({ file, owner, requesterOwner }) {
    if (!file) {
      throw createError(400, 'VALIDATION_ERROR', 'Arquivo e owner são obrigatórios');
    }

    const normalizedOwner = typeof owner === 'string' ? owner.trim() : '';
    const normalizedRequesterOwner =
      typeof requesterOwner === 'string' ? requesterOwner.trim() : '';

    if (!normalizedOwner) {
      if (file && file.path) {
        await storageRepository.deleteFileIfInsideStorage(file.path);
      }

      throw createError(400, 'VALIDATION_ERROR', 'Arquivo e owner são obrigatórios');
    }

    if (normalizedRequesterOwner && normalizedRequesterOwner !== normalizedOwner) {
      if (file && file.path) {
        await storageRepository.deleteFileIfInsideStorage(file.path);
      }

      throw createError(403, 'OWNER_MISMATCH', 'Owner da requisição não corresponde ao owner do payload');
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

    const createdRecord = documentRepository.create(documentRecord);

    return toPublicDocumentModel(createdRecord);
  }

  function listDocuments({ requesterOwner }) {
    const normalizedRequesterOwner =
      typeof requesterOwner === 'string' ? requesterOwner.trim() : '';

    if (!normalizedRequesterOwner) {
      throw createError(400, 'VALIDATION_ERROR', 'Owner da requisição é obrigatório');
    }

    const documents = documentRepository.findAll({ owner: normalizedRequesterOwner });

    return documents.map(toPublicDocumentModel);
  }

  async function getDownloadDocumentById(id, requesterOwner) {
    const normalizedRequesterOwner =
      typeof requesterOwner === 'string' ? requesterOwner.trim() : '';

    if (!normalizedRequesterOwner) {
      throw createError(400, 'VALIDATION_ERROR', 'Owner da requisição é obrigatório');
    }

    const documentRecord = documentRepository.findByIdAndOwner(id, normalizedRequesterOwner);

    if (!documentRecord) {
      throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
    }

    const safePath = storageRepository.assertPathInsideStorage(documentRecord.localPath);

    if (!safePath) {
      throw createError(500, 'INVALID_STORAGE_PATH', 'Caminho de armazenamento inválido para o documento');
    }

    if (!(await storageRepository.fileExists(safePath))) {
      throw createError(410, 'DOCUMENT_FILE_MISSING', 'Arquivo do documento não está mais disponível');
    }

    return {
      metadata: toPublicDocumentModel(documentRecord),
      localPath: safePath,
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