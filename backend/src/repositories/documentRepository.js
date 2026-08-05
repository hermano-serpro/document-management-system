const documents = [];
let nextId = 1;

function save(doc) {
  const record = { id: nextId++, ...doc };
  documents.push(record);
  return record;
}

function findAll() {
  return [...documents];
}

function findById(id) {
  return documents.find((d) => d.id === Number(id)) || null;
}

function clear() {
  documents.length = 0;
  nextId = 1;
}

module.exports = { save, findAll, findById, clear };
