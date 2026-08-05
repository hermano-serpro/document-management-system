function createInMemoryDocumentRepository() {
  const documents = [];

  function create(documentRecord) {
    const record = { ...documentRecord };
    documents.push(record);
    return { ...record };
  }

  function findAll(filters = {}) {
    const { owner } = filters;

    if (!owner) {
      return documents.map((document) => ({ ...document }));
    }

    return documents
      .filter((document) => document.owner === owner)
      .map((document) => ({ ...document }));
  }

  function findById(id) {
    const found = documents.find((document) => document.id === id);
    return found ? { ...found } : null;
  }

  function findByIdAndOwner(id, owner) {
    const found = documents.find(
      (document) => document.id === id && document.owner === owner
    );

    return found ? { ...found } : null;
  }

  function clear() {
    documents.length = 0;
  }

  return {
    create,
    findAll,
    findById,
    findByIdAndOwner,
    clear,
  };
}

module.exports = {
  createInMemoryDocumentRepository,
};