import { describe, expect, test } from 'vitest';
import { alignX, wrapLine } from './rasterize';
import { isCatPrinterName } from './webBluetooth';

describe('wrapLine', () => {
  test('no corta líneas que caben', () => {
    expect(wrapLine('hola', 32)).toEqual(['hola']);
  });

  test('corta en trozos del ancho máximo respetando acentos', () => {
    expect(wrapLine('ñandú pingüino', 5)).toEqual(['ñandú', ' ping', 'üino']);
  });
});

test('alignX ubica el contenido en los 384 puntos', () => {
  expect(alignX('left', 100)).toBe(0);
  expect(alignX('center', 100)).toBe(142);
  expect(alignX('right', 100)).toBe(284);
});

test('isCatPrinterName reconoce YT01 y modelos similares', () => {
  expect(isCatPrinterName('YT01')).toBe(true);
  expect(isCatPrinterName('GB02')).toBe(true);
  expect(isCatPrinterName('MX05')).toBe(true);
  expect(isCatPrinterName('PT-210')).toBe(false);
  expect(isCatPrinterName(undefined)).toBe(false);
});
