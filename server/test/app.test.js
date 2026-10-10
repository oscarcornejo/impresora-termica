import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createPrinterManager } from '../src/printer.js';
import { openDatabase } from '../src/db.js';

function fakeConnection(id) {
  const written = [];
  let open = true;
  return {
    transport: 'serial',
    id,
    written,
    isOpen: () => open,
    write: async (data) => {
      written.push(data);
    },
    close: async () => {
      open = false;
    },
  };
}

let server;
let baseUrl;
let lastConnection;

before(async () => {
  const printer = createPrinterManager({
    connectors: {
      serial: async (id) => (lastConnection = fakeConnection(id)),
      ble: async () => {
        throw new Error('BLE falló');
      },
    },
  });
  const list = async () => ({ devices: [{ id: '/dev/cu.Printer', name: 'Printer', transport: 'serial' }], warnings: [] });
  const app = createApp({ printer, db: openDatabase(':memory:'), list, logger: { error: () => {} } });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const post = (path, body) =>
  fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, body: await r.json() }));

const textDoc = { blocks: [{ type: 'text', text: 'Hola' }] };

test('imprimir sin conexión devuelve error 500 legible', async () => {
  const res = await post('/api/print', textDoc);
  assert.equal(res.status, 500);
  assert.equal(res.body.error, 'La impresora no está conectada. Conéctala de nuevo y vuelve a intentar.');
});

test('GET /api/devices devuelve la lista', async () => {
  const body = await fetch(`${baseUrl}/api/devices`).then((r) => r.json());
  assert.equal(body.success, true);
  assert.equal(body.data.devices[0].name, 'Printer');
});

test('connect valida el cuerpo', async () => {
  const res = await post('/api/connect', { transport: 'usb', id: 'x' });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /transport/);
});

test('connect + print envía ESC/POS a la conexión', async () => {
  const conn = await post('/api/connect', { transport: 'serial', id: '/dev/cu.Printer' });
  assert.deepEqual(conn.body.data, { connected: true, transport: 'serial', id: '/dev/cu.Printer' });

  const res = await post('/api/print', textDoc);
  assert.equal(res.status, 200);
  assert.equal(lastConnection.written.length, 1);
  assert.ok(lastConnection.written[0].includes(Buffer.from('Hola\n')));
  assert.equal(res.body.data.bytes, lastConnection.written[0].length);
});

test('print rechaza documentos vacíos o imágenes inconsistentes', async () => {
  assert.equal((await post('/api/print', { blocks: [] })).status, 400);
  const badImage = { blocks: [{ type: 'image', width: 16, height: 2, data: 'AAAA' }] };
  const res = await post('/api/print', badImage);
  assert.equal(res.status, 400);
  assert.match(res.body.error, /imagen/);
});

test('error al conectar BLE se reporta y deja desconectado', async () => {
  const res = await post('/api/connect', { transport: 'ble', id: 'abc' });
  assert.equal(res.status, 500);
  assert.equal(res.body.error, 'BLE falló');
  const status = await fetch(`${baseUrl}/api/status`).then((r) => r.json());
  assert.equal(status.data.connected, false);
});

test('render devuelve los bytes ESC/POS sin imprimir', async () => {
  const res = await fetch(`${baseUrl}/api/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(textDoc),
  });
  assert.equal(res.headers.get('content-type'), 'application/octet-stream');
  const bytes = Buffer.from(await res.arrayBuffer());
  assert.deepEqual([...bytes.subarray(0, 2)], [0x1b, 0x40]);
  assert.ok(bytes.includes(Buffer.from('Hola\n')));
});

test('render con protocol cat devuelve paquetes 51 78 y rechaza texto', async () => {
  const image = { type: 'image', width: 8, height: 1, data: 'gA==', align: 'left' };
  const res = await fetch(`${baseUrl}/api/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ protocol: 'cat', blocks: [image] }),
  });
  const bytes = Buffer.from(await res.arrayBuffer());
  assert.deepEqual([...bytes.subarray(0, 2)], [0x51, 0x78]);

  const bad = await post('/api/render', { protocol: 'cat', blocks: [{ type: 'text', text: 'x' }] });
  assert.equal(bad.status, 400);
});

test('disconnect cierra la conexión', async () => {
  await post('/api/connect', { transport: 'serial', id: '/dev/cu.Printer' });
  const res = await post('/api/disconnect', {});
  assert.equal(res.body.data.connected, false);
});
