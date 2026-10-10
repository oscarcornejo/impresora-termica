// Píxeles RGBA → bits 1-bpp para la impresora. Sin dependencias del navegador (lo usa también la app de iPhone).

export interface Pixels {
  width: number;
  height: number;
  /** RGBA, 4 bytes por píxel (como ImageData.data). */
  data: Uint8ClampedArray;
}

const DEFAULT_THRESHOLD = 128;
export const BYTE_BITS = 8;

function luminance(data: Uint8ClampedArray, i: number): number {
  const alpha = data[i + 3] / 255;
  const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  return gray * alpha + 255 * (1 - alpha); // Transparente = blanco.
}

/**
 * Convierte píxeles RGBA a bits 1-bpp empaquetados por fila (1 = negro),
 * con difusión de error Floyd–Steinberg opcional para fotos.
 */
export function pixelsToBits(pixels: Pixels, dither = true, threshold = DEFAULT_THRESHOLD): Uint8Array {
  const { width, height, data } = pixels;
  const gray = Float32Array.from({ length: width * height }, (_, p) => luminance(data, p * 4));
  const bytesPerRow = Math.ceil(width / BYTE_BITS);
  const out = new Uint8Array(bytesPerRow * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const isBlack = gray[p] < threshold;
      if (isBlack) out[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
      if (dither) spreadError(gray, width, height, x, y, gray[p] - (isBlack ? 0 : 255));
    }
  }
  return out;
}

function spreadError(gray: Float32Array, w: number, h: number, x: number, y: number, err: number) {
  const add = (dx: number, dy: number, factor: number) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < w && ny < h) gray[ny * w + nx] += err * factor;
  };
  add(1, 0, 7 / 16);
  add(-1, 1, 3 / 16);
  add(0, 1, 5 / 16);
  add(1, 1, 1 / 16);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}
