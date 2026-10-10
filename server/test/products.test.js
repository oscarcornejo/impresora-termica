import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { createPrinterManager } from '../src/printer.js';
import { openDatabase } from '../src/db.js';

let server;
let baseUrl;

before(async () => {
  const app = createApp({ printer: createPrinterManager(), db: openDatabase(':memory:'), logger: { error: () => {} } });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const call = (method, path, body) =>
  fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, body: await r.json() }));

test('crea, lista ordenado por nombre, edita y elimina un producto', async () => {
  const cafe = await call('POST', '/api/products', { name: '  Café  ', price: 2500, code: 'C1' });
  assert.equal(cafe.status, 201);
  assert.equal(cafe.body.data.name, 'Café'); // se recortan espacios
  await call('POST', '/api/products', { name: 'Agua', price: 1000 });

  const list = await call('GET', '/api/products');
  assert.deepEqual(list.body.data.map((p) => p.name), ['Agua', 'Café']);

  const id = cafe.body.data.id;
  const edited = await call('PUT', `/api/products/${id}`, { name: 'Café grande', price: 3000, code: 'C1' });
  assert.equal(edited.body.data.price, 3000);

  assert.equal((await call('DELETE', `/api/products/${id}`)).status, 200);
  assert.equal((await call('DELETE', `/api/products/${id}`)).status, 404);
});

test('busca por nombre o código y trata % como texto literal', async () => {
  await call('POST', '/api/products', { name: 'Jugo natural', price: 3200, code: 'J-01' });
  await call('POST', '/api/products', { name: 'Descuento 10%', price: 0 });

  const byName = await call('GET', '/api/products?search=jugo');
  assert.deepEqual(byName.body.data.map((p) => p.name), ['Jugo natural']);
  const byCode = await call('GET', '/api/products?search=J-01');
  assert.equal(byCode.body.data.length, 1);
  const literal = await call('GET', '/api/products?search=10%25');
  assert.deepEqual(literal.body.data.map((p) => p.name), ['Descuento 10%']);
});

test('valida nombre y precio', async () => {
  assert.equal((await call('POST', '/api/products', { name: '', price: 100 })).status, 400);
  assert.equal((await call('POST', '/api/products', { name: 'X', price: -1 })).status, 400);
  const decimal = await call('POST', '/api/products', { name: 'X', price: 10.5 });
  assert.equal(decimal.status, 400);
  assert.match(decimal.body.error, /entero/);
});

test('código duplicado devuelve 409; código vacío se permite repetido', async () => {
  await call('POST', '/api/products', { name: 'Pan', price: 200, code: 'P1' });
  const dup = await call('POST', '/api/products', { name: 'Otro pan', price: 300, code: 'P1' });
  assert.equal(dup.status, 409);
  assert.match(dup.body.error, /código/);
  assert.equal((await call('POST', '/api/products', { name: 'A', price: 1, code: '' })).status, 201);
  assert.equal((await call('POST', '/api/products', { name: 'B', price: 1, code: '' })).status, 201);
});

test('editar un producto inexistente devuelve 404 e id inválido 400', async () => {
  assert.equal((await call('PUT', '/api/products/9999', { name: 'X', price: 1 })).status, 404);
  assert.equal((await call('PUT', '/api/products/abc', { name: 'X', price: 1 })).status, 400);
});

test('datos del negocio: valores por defecto y actualización', async () => {
  const initial = await call('GET', '/api/business');
  assert.equal(initial.body.data.name, 'MI NEGOCIO');
  const saved = await call('PUT', '/api/business', { name: 'Café Oscar', address: 'Calle 1', phone: '', footer: 'Vuelva pronto' });
  assert.equal(saved.body.data.name, 'Café Oscar');
  assert.equal((await call('GET', '/api/business')).body.data.footer, 'Vuelva pronto');
  assert.equal((await call('PUT', '/api/business', { name: '' })).status, 400);
});

test('las migraciones se aplican una sola vez y los datos persisten en disco', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tienda-'));
  try {
    const path = join(dir, 'tienda.db');
    const first = openDatabase(path);
    first.prepare("INSERT INTO products (name, price) VALUES ('Té', 900)").run();
    first.close();
    const second = openDatabase(path);
    assert.equal(second.prepare('SELECT COUNT(*) AS n FROM products').get().n, 1);
    second.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
