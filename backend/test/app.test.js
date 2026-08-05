const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');
const { documentRepository } = require('../src/container');
const { storageDirectory } = require('../src/upload/uploadMiddleware');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);

  await new Promise((resolve) => {
    server.once('listening', resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(async () => {
  documentRepository.clear();

  const fileNames = await fs.readdir(storageDirectory);
  const filesToDelete = fileNames.filter((fileName) => fileName !== '.gitkeep');

  await Promise.all(
    filesToDelete.map((fileName) => fs.unlink(path.join(storageDirectory, fileName)))
  );
});

after(async () => {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test('GET /health retorna status ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, { status: 'ok' });
});

test('POST /upload salva documento e retorna metadados', async () => {
  const formData = new FormData();
  formData.append('owner', 'user-123');
  formData.append(
    'file',
    new Blob(['conteudo de teste'], { type: 'text/plain' }),
    'arquivo.txt'
  );

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  const body = await response.json();

  assert.strictEqual(response.status, 201);
  assert.ok(body.id);
  assert.strictEqual(body.originalName, 'arquivo.txt');
  assert.strictEqual(body.owner, 'user-123');
  assert.ok(body.storagePath.startsWith('storage/'));
  assert.strictEqual(typeof body.size, 'number');
});

test('POST /upload retorna 400 sem owner', async () => {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob(['conteudo sem owner'], { type: 'text/plain' }),
    'sem-owner.txt'
  );

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
});

test('GET /documents lista documentos e permite filtro por owner', async () => {
  const uploadA = new FormData();
  uploadA.append('owner', 'alice');
  uploadA.append('file', new Blob(['A'], { type: 'text/plain' }), 'a.txt');

  const uploadB = new FormData();
  uploadB.append('owner', 'bob');
  uploadB.append('file', new Blob(['B'], { type: 'text/plain' }), 'b.txt');

  await fetch(`${baseUrl}/upload`, { method: 'POST', body: uploadA });
  await fetch(`${baseUrl}/upload`, { method: 'POST', body: uploadB });

  const allResponse = await fetch(`${baseUrl}/documents`);
  const allBody = await allResponse.json();

  const filteredResponse = await fetch(`${baseUrl}/documents?owner=alice`);
  const filteredBody = await filteredResponse.json();

  assert.strictEqual(allResponse.status, 200);
  assert.strictEqual(allBody.total, 2);
  assert.strictEqual(filteredResponse.status, 200);
  assert.strictEqual(filteredBody.total, 1);
  assert.strictEqual(filteredBody.items[0].owner, 'alice');
});

test('GET /documents/:id/download retorna binario do arquivo', async () => {
  const uploadForm = new FormData();
  uploadForm.append('owner', 'user-download');
  uploadForm.append(
    'file',
    new Blob(['conteudo para download'], { type: 'text/plain' }),
    'download.txt'
  );

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm,
  });
  const uploadBody = await uploadResponse.json();

  const response = await fetch(`${baseUrl}/documents/${uploadBody.id}/download`);
  const bodyText = await response.text();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(bodyText, 'conteudo para download');
});

test('GET /documents/:id/download retorna 404 para id inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/id-inexistente/download`);
  const body = await response.json();

  assert.strictEqual(response.status, 404);
  assert.strictEqual(body.error.code, 'DOCUMENT_NOT_FOUND');
});

test('GET /documents/:id/download retorna 410 quando arquivo físico não existe', async () => {
  const uploadForm = new FormData();
  uploadForm.append('owner', 'user-410');
  uploadForm.append('file', new Blob(['arquivo removido'], { type: 'text/plain' }), 'gone.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm,
  });
  const uploadBody = await uploadResponse.json();

  await fs.unlink(path.join(storageDirectory, uploadBody.filename));

  const response = await fetch(`${baseUrl}/documents/${uploadBody.id}/download`);
  const body = await response.json();

  assert.strictEqual(response.status, 410);
  assert.strictEqual(body.error.code, 'DOCUMENT_FILE_MISSING');
});
