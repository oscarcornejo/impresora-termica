import { describe, expect, test } from 'vitest';
import { alignX, rasterizeBlocks, RASTER_DOTS, wrapLine, type RasterCanvas } from './rasterize';
import { isCatPrinterName } from './webBluetooth';
import { fromBase64 } from './encoding/bytes';

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

// Lienzo falso: cada carácter mide 12 puntos y el texto se "dibuja" como un rectángulo negro.
const CHAR_DOTS = 12;
function createFakeCanvas(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  const calls: string[] = [];
  let fontSize = 0;
  const fillRect = (x: number, y: number, w: number, h: number) => {
    for (let row = Math.max(0, y); row < Math.min(height, y + h); row++) {
      for (let col = Math.max(0, x); col < Math.min(width, x + w); col++) data.set([0, 0, 0, 255], (row * width + col) * 4);
    }
  };
  const canvas: RasterCanvas = {
    setFont: (size, isBold) => {
      fontSize = size;
      calls.push(`font ${size} ${isBold ? 'bold' : 'normal'}`);
    },
    measureText: (text) => Array.from(text).length * CHAR_DOTS * (fontSize / 20),
    fillText: (text, x, top) => {
      calls.push(`text "${text}" x=${x} top=${Math.round(top)}`);
      fillRect(x, Math.round(top), canvas.measureText(text), 4);
    },
    fillRect,
    getPixels: () => ({ width, height, data }),
  };
  return { canvas, calls, size: { width, height } };
}

describe('rasterizeBlocks', () => {
  test('dibuja en el lienzo que recibe y devuelve una imagen de 384 puntos', () => {
    let fake: ReturnType<typeof createFakeCanvas> | null = null;
    const image = rasterizeBlocks(
      [
        { type: 'text', text: 'HOLA', align: 'center', bold: true, underline: false, size: 1 },
        { type: 'feed', lines: 1 },
      ],
      (width, height) => {
        fake = createFakeCanvas(width, height);
        return fake.canvas;
      },
    );
    expect(fake).not.toBeNull();
    const { calls, size } = fake!;
    expect(size.width).toBe(RASTER_DOTS);
    expect(image).toMatchObject({ type: 'image', width: RASTER_DOTS, height: size.height, align: 'left' });
    // Texto de 4 caracteres centrado: (384 - 48) / 2 = 168.
    expect(calls).toContain('font 20 bold');
    expect(calls.some((c) => c.startsWith('text "HOLA" x=168'))).toBe(true);
    // Línea de texto (25 puntos) + avance de papel (24 puntos).
    expect(size.height).toBe(25 + 24);
    const bits = fromBase64(image.data);
    expect(bits.length).toBe((RASTER_DOTS / 8) * size.height);
    expect(bits.some((b) => b !== 0)).toBe(true);
  });

  test('un ticket vacío igual tiene al menos una fila', () => {
    const image = rasterizeBlocks([], (w, h) => createFakeCanvas(w, h).canvas);
    expect(image.height).toBe(1);
  });
});
