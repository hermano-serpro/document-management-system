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
  const owner = 'user-123';
  const formData = new FormData();
  formData.append('owner', owner);
  formData.append(
    'file',
    new Blob(['conteudo de teste'], { type: 'text/plain' }),
    'arquivo.txt'
  );

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'x-owner-id': owner,
    },
  });
  const body = await response.json();

  assert.strictEqual(response.status, 201);
  assert.ok(body.id);
  assert.strictEqual(body.originalName, 'arquivo.txt');
  assert.strictEqual(body.owner, owner);
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

test('POST /upload retorna 403 quando owner do header diverge do payload', async () => {
  const formData = new FormData();
  formData.append('owner', 'alice');
  formData.append(
    'file',
    new Blob(['conteudo owner divergente'], { type: 'text/plain' }),
    'owner-divergente.txt'
  );

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'x-owner-id': 'bob',
    },
  });
  const body = await response.json();

  assert.strictEqual(response.status, 403);
  assert.strictEqual(body.error.code, 'OWNER_MISMATCH');
});

test('POST /upload retorna 400 para MIME type não permitido', async () => {
  const formData = new FormData();
  formData.append('owner', 'user-mime');
  formData.append(
    'file',
    new Blob(['<html></html>'], { type: 'text/html' }),
    'arquivo.html'
  );

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'x-owner-id': 'user-mime',
    },
  });
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(body.error.code, 'UNSUPPORTED_MEDIA_TYPE');
});

test('GET /documents lista documentos do owner requisitante', async () => {
  const uploadA = new FormData();
  uploadA.append('owner', 'alice');
  uploadA.append('file', new Blob(['A'], { type: 'text/plain' }), 'a.txt');

  const uploadB = new FormData();
  uploadB.append('owner', 'bob');
  uploadB.append('file', new Blob(['B'], { type: 'text/plain' }), 'b.txt');

  await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadA,
    headers: {
      'x-owner-id': 'alice',
    },
  });
  await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadB,
    headers: {
      'x-owner-id': 'bob',
    },
  });

  const aliceResponse = await fetch(`${baseUrl}/documents`, {
    headers: {
      'x-owner-id': 'alice',
    },
  });
  const aliceBody = await aliceResponse.json();

  const bobResponse = await fetch(`${baseUrl}/documents`, {
    headers: {
      'x-owner-id': 'bob',
    },
  });
  const bobBody = await bobResponse.json();

  assert.strictEqual(aliceResponse.status, 200);
  assert.strictEqual(aliceBody.total, 1);
  assert.strictEqual(aliceBody.items[0].owner, 'alice');

  assert.strictEqual(bobResponse.status, 200);
  assert.strictEqual(bobBody.total, 1);
  assert.strictEqual(bobBody.items[0].owner, 'bob');
});

test('GET /documents retorna 400 sem owner da requisição', async () => {
  const response = await fetch(`${baseUrl}/documents`);
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
});

test('GET /documents/:id/download retorna binario do arquivo', async () => {
  const owner = 'user-download';
  const uploadForm = new FormData();
  uploadForm.append('owner', owner);
  uploadForm.append(
    'file',
    new Blob(['conteudo para download'], { type: 'text/plain' }),
    'download.txt'
  );

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm,
    headers: {
      'x-owner-id': owner,
    },
  });
  const uploadBody = await uploadResponse.json();

  const response = await fetch(`${baseUrl}/documents/${uploadBody.id}/download`, {
    headers: {
      'x-owner-id': owner,
    },
  });
  const bodyText = await response.text();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(bodyText, 'conteudo para download');
});

test('GET /documents/:id/download retorna 404 para id inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/id-inexistente/download`, {
    headers: {
      'x-owner-id': 'owner-desconhecido',
    },
  });
  const body = await response.json();

  assert.strictEqual(response.status, 404);
  assert.strictEqual(body.error.code, 'DOCUMENT_NOT_FOUND');
});

test('GET /documents/:id/download retorna 404 para owner divergente', async () => {
  const owner = 'owner-real';
  const uploadForm = new FormData();
  uploadForm.append('owner', owner);
  uploadForm.append(
    'file',
    new Blob(['download com owner divergente'], { type: 'text/plain' }),
    'owner-real.txt'
  );

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm,
    headers: {
      'x-owner-id': owner,
    },
  });
  const uploadBody = await uploadResponse.json();

  const response = await fetch(`${baseUrl}/documents/${uploadBody.id}/download`, {
    headers: {
      'x-owner-id': 'owner-errado',
    },
  });
  const body = await response.json();

  assert.strictEqual(response.status, 404);
  assert.strictEqual(body.error.code, 'DOCUMENT_NOT_FOUND');
});

test('GET /documents/:id/download retorna 400 sem owner da requisição', async () => {
  const response = await fetch(`${baseUrl}/documents/id-inexistente/download`);
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
});

test('GET /documents/:id/download retorna 410 quando arquivo físico não existe', async () => {
  const owner = 'user-410';
  const uploadForm = new FormData();
  uploadForm.append('owner', owner);
  uploadForm.append('file', new Blob(['arquivo removido'], { type: 'text/plain' }), 'gone.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm,
    headers: {
      'x-owner-id': owner,
    },
  });
  const uploadBody = await uploadResponse.json();

  assert.strictEqual(uploadResponse.status, 201);
  assert.ok(uploadBody.id);

  const fileNames = await fs.readdir(storageDirectory);
  const storedFileName = fileNames.find((fileName) => fileName !== '.gitkeep');

  assert.ok(storedFileName);

  await fs.unlink(path.join(storageDirectory, storedFileName));

  const response = await fetch(`${baseUrl}/documents/${uploadBody.id}/download`, {
    headers: {
      'x-owner-id': owner,
    },
  });
  const body = await response.json();

  assert.strictEqual(response.status, 410);
  assert.strictEqual(body.error.code, 'DOCUMENT_FILE_MISSING');
});
