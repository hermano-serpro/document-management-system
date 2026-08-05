const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const FormData = require('form-data');

const app = require('../src/app');
const repository = require('../src/repositories/documentRepository');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  repository.clear();
});

function request(method, urlPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const options = { method, hostname: url.hostname, port: url.port, path: url.pathname + url.search };
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let json;
        try { json = JSON.parse(raw); } catch { json = null; }
        resolve({ status: res.statusCode, headers: res.headers, body: json, raw });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function uploadFile(content = 'hello', filename = 'test.txt') {
  const form = new FormData();
  form.append('file', Buffer.from(content), { filename, contentType: 'text/plain' });
  return new Promise((resolve, reject) => {
    const url = new URL('/upload', baseUrl);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: form.getHeaders(),
    };
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let json;
        try { json = JSON.parse(raw); } catch { json = null; }
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('GET /health retorna status ok', async () => {
  const res = await request('GET', '/health');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { status: 'ok' });
});

test('POST /upload sem arquivo retorna 400', async () => {
  const res = await new Promise((resolve, reject) => {
    const url = new URL('/upload', baseUrl);
    const req = http.request({
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'content-type': 'application/json', 'content-length': '2' },
    }, (response) => {
      const chunks = [];
      response.on('data', (c) => chunks.push(c));
      response.on('end', () => {
        let json; try { json = JSON.parse(Buffer.concat(chunks).toString()); } catch { json = null; }
        resolve({ status: response.statusCode, body: json });
      });
    });
    req.on('error', reject);
    req.end('{}');
  });
  assert.strictEqual(res.status, 400);
});

test('POST /upload com arquivo retorna 201 e metadados', async () => {
  const res = await uploadFile('conteúdo do arquivo', 'documento.txt');
  assert.strictEqual(res.status, 201);
  assert.ok(res.body.id, 'deve retornar um id');
  assert.strictEqual(res.body.originalName, 'documento.txt');

  if (res.body && res.body.path) {
    try { fs.unlinkSync(res.body.path); } catch {}
  }
});

test('GET /documents lista os documentos enviados', async () => {
  const up = await uploadFile('conteúdo', 'lista.txt');
  const res = await request('GET', '/documents');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.strictEqual(res.body.length, 1);
  assert.strictEqual(res.body[0].originalName, 'lista.txt');

  if (up.body && up.body.path) {
    try { fs.unlinkSync(up.body.path); } catch {}
  }
});

test('GET /documents retorna lista vazia quando não há documentos', async () => {
  const res = await request('GET', '/documents');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, []);
});

test('GET /documents/:id/download retorna 404 para id inexistente', async () => {
  const res = await request('GET', '/documents/999/download');
  assert.strictEqual(res.status, 404);
});

test('GET /documents/:id/download retorna o arquivo', async () => {
  const content = 'arquivo de download';
  const up = await uploadFile(content, 'download.txt');
  const id = up.body.id;
  const filePath = up.body.path;

  const res = await new Promise((resolve, reject) => {
    const url = new URL(`/documents/${id}/download`, baseUrl);
    const req = http.request({ method: 'GET', hostname: url.hostname, port: url.port, path: url.pathname }, (response) => {
      const chunks = [];
      response.on('data', (c) => chunks.push(c));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString(), headers: response.headers }));
    });
    req.on('error', reject);
    req.end();
  });

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.includes('arquivo de download'));

  if (filePath) {
    try { fs.unlinkSync(filePath); } catch {}
  }
});
