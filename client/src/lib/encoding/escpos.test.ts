import { describe, expect, test } from 'vitest';
import { buildDocument, encodeText, qr, rasterImage, separator, size } from './escpos';
import { indexOfBytes } from './bytes';
import type { PrintDocument } from '../types';

const ascii = (text: string) => Uint8Array.from(text, (c) => c.charCodeAt(0));

describe('ESC/POS', () => {
  test('encodeText convierte acentos y ñ a CP850', () => {
    expect([...encodeText('Año ¿qué?')]).toEqual([0x41, 0xa4, 0x6f, 0x20, 0xa8, 0x71, 0x75, 0x82, 0x3f]);
  });

  test('encodeText reemplaza caracteres no soportados por ?', () => {
    expect([...encodeText('a😀b')]).toEqual([0x61, 0x3f, 0x62]);
  });

  test('size combina ancho y alto en GS ! n', () => {
    expect([...size(2, 3)]).toEqual([0x1d, 0x21, 0x12]);
    expect([...size(99, 0)]).toEqual([0x1d, 0x21, 0x70]);
  });

  test('separator usa el ancho de caracteres del papel', () => {
    expect(separator(58).length).toBe(33);
    expect(separator(80).length).toBe(49);
  });

  test('qr incluye la longitud correcta y los datos', () => {
    const out = qr('hola');
    const storeIdx = indexOfBytes(out, Uint8Array.of(0x31, 0x50, 0x30));
    expect(out[storeIdx - 2]).toBe(7); // 4 bytes + 3
    expect([...out.subarray(storeIdx + 3, storeIdx + 7)]).toEqual([...ascii('hola')]);
  });

  test('rasterImage genera cabecera GS v 0 con bytes por fila y alto', () => {
    const out = rasterImage(16, 2, new Uint8Array(4).fill(0xff));
    expect([...out.subarray(0, 8)]).toEqual([0x1d, 0x76, 0x30, 0, 2, 0, 2, 0]);
    expect(out.length).toBe(12);
  });

  test('rasterImage rechaza datos de tamaño incorrecto', () => {
    expect(() => rasterImage(16, 2, new Uint8Array(3))).toThrow(/4 bytes/);
  });

  test('buildDocument empieza con init y termina con corte opcional', () => {
    const doc: PrintDocument = {
      paperWidth: 58,
      cut: true,
      blocks: [{ type: 'text', text: 'Hola\nMundo', align: 'center', bold: true, underline: false, size: 2 }],
    };
    const out = buildDocument(doc);
    expect([...out.subarray(0, 5)]).toEqual([0x1b, 0x40, 0x1b, 0x74, 2]);
    expect([...out.subarray(-4)]).toEqual([0x1d, 0x56, 0x42, 0x00]);
    expect(indexOfBytes(out, ascii('Hola\nMundo\n'))).toBeGreaterThan(0);
    expect(indexOfBytes(buildDocument({ ...doc, cut: false }), Uint8Array.of(0x1d, 0x56))).toBe(-1);
  });
});
