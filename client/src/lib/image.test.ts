import { describe, expect, test } from 'vitest';
import { pixelsToBits, bytesToBase64 } from './image';

function solid(width: number, height: number, rgba: [number, number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set(rgba, i);
  return { width, height, data };
}

describe('pixelsToBits', () => {
  test('negro sólido produce todos los bits en 1', () => {
    expect([...pixelsToBits(solid(8, 2, [0, 0, 0, 255]), false)]).toEqual([0xff, 0xff]);
  });

  test('blanco y transparente producen bits en 0', () => {
    expect([...pixelsToBits(solid(8, 1, [255, 255, 255, 255]), false)]).toEqual([0x00]);
    expect([...pixelsToBits(solid(8, 1, [0, 0, 0, 0]), false)]).toEqual([0x00]);
  });

  test('rellena con ceros cuando el ancho no es múltiplo de 8', () => {
    expect([...pixelsToBits(solid(10, 1, [0, 0, 0, 255]), false)]).toEqual([0xff, 0xc0]);
  });

  test('el dithering de un gris medio deja aproximadamente la mitad en negro', () => {
    const bits = pixelsToBits(solid(16, 16, [128, 128, 128, 255]), true);
    const black = [...bits].reduce((n, b) => n + b.toString(2).split('1').length - 1, 0);
    expect(black).toBeGreaterThan(256 * 0.4);
    expect(black).toBeLessThan(256 * 0.6);
  });
});

test('bytesToBase64 codifica correctamente', () => {
  expect(bytesToBase64(new Uint8Array([0xff, 0x00, 0x10]))).toBe('/wAQ');
});
