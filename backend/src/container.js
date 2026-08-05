const { createInMemoryDocumentRepository } = require('./repositories/documentRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRoutes } = require('./routes/documentRoutes');
const { upload } = require('./upload/uploadMiddleware');

const documentRepository = createInMemoryDocumentRepository();
const documentService = createDocumentService({ documentRepository });
const documentController = createDocumentController({ documentService });
const documentRoutes = createDocumentRoutes({ documentController, upload });

module.exports = {
  documentRepository,
  documentService,
  documentController,
  documentRoutes,
};