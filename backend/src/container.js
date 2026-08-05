const { createInMemoryDocumentRepository } = require('./repositories/documentRepository');
const { createStorageRepository } = require('./repositories/storageRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRoutes } = require('./routes/documentRoutes');
const { upload, storageDirectory } = require('./upload/uploadMiddleware');

const documentRepository = createInMemoryDocumentRepository();
const storageRepository = createStorageRepository({ storageDirectory });
const documentService = createDocumentService({ documentRepository, storageRepository });
const documentController = createDocumentController({ documentService });
const documentRoutes = createDocumentRoutes({ documentController, upload });

module.exports = {
  documentRepository,
  storageRepository,
  documentService,
  documentController,
  documentRoutes,
};