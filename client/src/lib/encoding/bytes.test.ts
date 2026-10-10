import { describe, expect, test } from 'vitest';
import { concatBytes, fromBase64, indexOfBytes, toHex } from './bytes';

describe('bytes', () => {
  test('concatBytes une arreglos de bytes en uno nuevo', () => {
    expect([...concatBytes([Uint8Array.of(1, 2), Uint8Array.of(3)])]).toEqual([1, 2, 3]);
    expect(concatBytes([]).length).toBe(0);
  });

  test('fromBase64 decodifica a bytes', () => {
    expect([...fromBase64('/w==')]).toEqual([0xff]);
    expect([...fromBase64('AAEC')]).toEqual([0, 1, 2]);
  });

  test('indexOfBytes encuentra una secuencia o devuelve -1', () => {
    const haystack = Uint8Array.of(9, 1, 2, 3, 1, 2);
    expect(indexOfBytes(haystack, Uint8Array.of(1, 2, 3))).toBe(1);
    expect(indexOfBytes(haystack, Uint8Array.of(7))).toBe(-1);
  });

  test('toHex escribe dos dígitos por byte', () => {
    expect(toHex(Uint8Array.of(0x51, 0x0a))).toBe('510a');
  });
});
