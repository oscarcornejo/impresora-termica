import { describe, expect, test } from 'vitest';
import { buildCatDocument, crc8, packet, toPrinterLine } from './catprinter';
import { toHex } from './bytes';
import type { PrintDocument } from '../types';

const base64Of = (bytes: number[]) => btoa(String.fromCharCode(...bytes));
const doc = (overrides: Partial<PrintDocument>): PrintDocument => ({ paperWidth: 58, cut: false, blocks: [], ...overrides });

describe('protocolo cat (YT01)', () => {
  test('crc8 coincide con los paquetes conocidos del protocolo', () => {
    expect(crc8([0x00])).toBe(0x00);
    expect(crc8([0x32])).toBe(0x9e);
    expect(crc8([0xaa, 0x55, 0x17, 0x38, 0x44, 0x5f, 0x5f, 0x5f, 0x44, 0x38, 0x2c])).toBe(0xa1);
    expect(crc8([0xaa, 0x55, 0x17, 0, 0, 0, 0, 0, 0, 0, 0x17])).toBe(0x11);
  });

  test('packet arma 51 78 CMD 00 LEN DATOS CRC FF', () => {
    expect(toHex(packet(0xa4, [0x32]))).toBe('5178a4000100329eff');
  });

  test('toPrinterLine invierte el orden de bits y rellena a 48 bytes', () => {
    const line = toPrinterLine(Uint8Array.of(0x80), 8, 'left');
    expect(line.length).toBe(48);
    expect(line[0]).toBe(0x01); // primer punto = bit menos significativo
  });

  test('toPrinterLine centra y alinea a la derecha', () => {
    const row = Uint8Array.of(0xff);
    const centered = toPrinterLine(row, 8, 'center'); // offset 188 → bytes 23 y 24
    expect(centered[23]).toBe(0xf0);
    expect(centered[24]).toBe(0x0f);
    expect(toPrinterLine(row, 8, 'right')[47]).toBe(0xff);
  });

  test('empieza pidiendo el estado y dibuja una línea A2 por fila', () => {
    const out = buildCatDocument(doc({
      blocks: [{ type: 'image', width: 16, height: 3, data: base64Of([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]), align: 'left' }],
    }));
    const drawLines = (toHex(out).match(/5178a2/g) ?? []).length;
    expect(drawLines).toBe(3);
    expect(toHex(out.subarray(0, 9))).toBe('5178a30001000000ff');
  });

  test('envía la energía según la intensidad (máxima por defecto)', () => {
    const blocks: PrintDocument['blocks'] = [{ type: 'feed', lines: 1 }];
    const energy = (d: PrintDocument) => toHex(buildCatDocument(d)).match(/5178af000200(....)/)?.[1];
    expect(energy(doc({ blocks }))).toBe('ffff');
    expect(energy(doc({ blocks, darkness: 'dark' }))).toBe('00e0');
    expect(energy(doc({ blocks, darkness: 'normal' }))).toBe('00c0');
  });

  test('rechaza bloques de texto', () => {
    expect(() => buildCatDocument(doc({
      blocks: [{ type: 'text', text: 'hola', align: 'left', bold: false, underline: false, size: 1 }],
    }))).toThrow(/solo imprime imágenes/);
  });

  test('avanza papel extra cuando se pide corte', () => {
    const blocks: PrintDocument['blocks'] = [{ type: 'feed', lines: 1 }];
    const feeds = (d: PrintDocument) => (toHex(buildCatDocument(d)).match(/5178a1000200/g) ?? []).length;
    expect(feeds(doc({ blocks, cut: true })) - feeds(doc({ blocks }))).toBe(2);
  });
});
