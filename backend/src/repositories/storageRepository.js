const fs = require('node:fs/promises');
const path = require('node:path');

function isPathInsideDirectory(targetPath, baseDirectory) {
  const relative = path.relative(baseDirectory, targetPath);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function createStorageRepository({ storageDirectory }) {
  async function fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async function deleteFileIfInsideStorage(filePath) {
    const absolutePath = path.resolve(filePath);

    if (!isPathInsideDirectory(absolutePath, storageDirectory)) {
      return false;
    }

    try {
      await fs.unlink(absolutePath);
      return true;
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  }

  function assertPathInsideStorage(filePath) {
    const absolutePath = path.resolve(filePath);

    if (!isPathInsideDirectory(absolutePath, storageDirectory)) {
      return null;
    }

    return absolutePath;
  }

  return {
    fileExists,
    deleteFileIfInsideStorage,
    assertPathInsideStorage,
  };
}

module.exports = {
  createStorageRepository,
};
