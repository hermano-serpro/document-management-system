function createInMemoryDocumentRepository() {
  const documents = [];

  function create(documentRecord) {
    documents.push(documentRecord);
    return documentRecord;
  }

  function findAll(filters = {}) {
    const { owner } = filters;

    if (!owner) {
      return [...documents];
    }

    return documents.filter((document) => document.owner === owner);
  }

  function findById(id) {
    return documents.find((document) => document.id === id) || null;
  }

  function clear() {
    documents.length = 0;
  }

  return {
    create,
    findAll,
    findById,
    clear,
  };
}

module.exports = {
  createInMemoryDocumentRepository,
};