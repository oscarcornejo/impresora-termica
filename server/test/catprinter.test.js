import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc8, packet, toPrinterLine, buildCatDocument } from '../src/catprinter.js';

const hex = (buf) => Buffer.from(buf).toString('hex');

test('crc8 coincide con los paquetes conocidos del protocolo', () => {
  assert.equal(crc8([0x00]), 0x00);
  assert.equal(crc8([0x32]), 0x9e);
  assert.equal(crc8([0xaa, 0x55, 0x17, 0x38, 0x44, 0x5f, 0x5f, 0x5f, 0x44, 0x38, 0x2c]), 0xa1);
  assert.equal(crc8([0xaa, 0x55, 0x17, 0, 0, 0, 0, 0, 0, 0, 0x17]), 0x11);
});

test('packet arma 51 78 CMD 00 LEN DATOS CRC FF', () => {
  assert.equal(hex(packet(0xa4, [0x32])), '5178a4000100329eff');
});

test('toPrinterLine invierte el orden de bits y rellena a 48 bytes', () => {
  const line = toPrinterLine(Buffer.from([0x80]), 8, 'left');
  assert.equal(line.length, 48);
  assert.equal(line[0], 0x01); // primer punto = bit menos significativo
});

test('toPrinterLine centra y alinea a la derecha', () => {
  const row = Buffer.from([0xff]);
  const centered = toPrinterLine(row, 8, 'center'); // offset 188 → bytes 23 y 24
  assert.equal(centered[23], 0xf0);
  assert.equal(centered[24], 0x0f);
  assert.equal(toPrinterLine(row, 8, 'right')[47], 0xff);
});

test('buildCatDocument empieza pidiendo el estado y dibuja una línea A2 por fila', () => {
  const doc = {
    blocks: [{ type: 'image', width: 16, height: 3, data: Buffer.alloc(6, 0xff).toString('base64'), align: 'left' }],
  };
  const out = buildCatDocument(doc);
  const drawLines = [...out.entries()].filter(
    ([i, b]) => b === 0x51 && out[i + 1] === 0x78 && out[i + 2] === 0xa2,
  );
  assert.equal(drawLines.length, 3);
  assert.equal(hex(out.subarray(0, 9)), '5178a30001000000ff');
});

test('buildCatDocument envía la energía según la intensidad (máxima por defecto)', () => {
  const blocks = [{ type: 'feed', lines: 1 }];
  const energyPacket = (doc) => hex(buildCatDocument(doc)).match(/5178af000200(....)/)[1];
  assert.equal(energyPacket({ blocks }), 'ffff');
  assert.equal(energyPacket({ blocks, darkness: 'dark' }), '00e0');
  assert.equal(energyPacket({ blocks, darkness: 'normal' }), '00c0');
});

test('buildCatDocument rechaza bloques de texto con status 400', () => {
  assert.throws(
    () => buildCatDocument({ blocks: [{ type: 'text', text: 'hola' }] }),
    (err) => err.status === 400 && /solo imprime imágenes/.test(err.message),
  );
});

test('buildCatDocument avanza papel extra cuando se pide corte', () => {
  const blocks = [{ type: 'feed', lines: 1 }];
  const feeds = (doc) => (hex(buildCatDocument(doc)).match(/5178a1000200/g) ?? []).length;
  assert.equal(feeds({ blocks, cut: true }) - feeds({ blocks, cut: false }), 2);
});
