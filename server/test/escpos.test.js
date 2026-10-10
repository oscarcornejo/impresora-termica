import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeText, size, qr, rasterImage, buildDocument, separator } from '../src/escpos.js';

test('encodeText convierte acentos y ñ a CP850', () => {
  assert.deepEqual([...encodeText('Año ¿qué?')], [0x41, 0xa4, 0x6f, 0x20, 0xa8, 0x71, 0x75, 0x82, 0x3f]);
});

test('encodeText reemplaza caracteres no soportados por ?', () => {
  assert.deepEqual([...encodeText('a😀b')], [0x61, 0x3f, 0x62]);
});

test('size combina ancho y alto en GS ! n', () => {
  assert.deepEqual([...size(2, 3)], [0x1d, 0x21, 0x12]);
  assert.deepEqual([...size(99, 0)], [0x1d, 0x21, 0x70]);
});

test('separator usa el ancho de caracteres del papel', () => {
  assert.equal(separator(58).length, 33);
  assert.equal(separator(80).length, 49);
});

test('qr incluye la longitud correcta y los datos', () => {
  const out = qr('hola');
  const storeIdx = out.indexOf(Buffer.from([0x31, 0x50, 0x30]));
  assert.equal(out[storeIdx - 2], 7); // 4 bytes + 3
  assert.equal(out.subarray(storeIdx + 3, storeIdx + 7).toString(), 'hola');
});

test('rasterImage genera cabecera GS v 0 con bytes por fila y alto', () => {
  const out = rasterImage(16, 2, Buffer.alloc(4, 0xff));
  assert.deepEqual([...out.subarray(0, 8)], [0x1d, 0x76, 0x30, 0, 2, 0, 2, 0]);
  assert.equal(out.length, 12);
});

test('rasterImage rechaza datos de tamaño incorrecto', () => {
  assert.throws(() => rasterImage(16, 2, Buffer.alloc(3)), /4 bytes/);
});

test('buildDocument empieza con init y termina con corte opcional', () => {
  const doc = {
    paperWidth: 58,
    cut: true,
    blocks: [{ type: 'text', text: 'Hola\nMundo', align: 'center', bold: true, underline: false, size: 2 }],
  };
  const out = buildDocument(doc);
  assert.deepEqual([...out.subarray(0, 5)], [0x1b, 0x40, 0x1b, 0x74, 2]);
  assert.deepEqual([...out.subarray(-4)], [0x1d, 0x56, 0x42, 0x00]);
  assert.ok(out.includes(Buffer.from('Hola\nMundo\n')));
  assert.ok(!buildDocument({ ...doc, cut: false }).includes(Buffer.from([0x1d, 0x56])));
});
