import { BYTE_BITS, bytesToBase64, pixelsToBits } from './bits';
import type { Align, ImageBlock } from './types';

export { bytesToBase64, pixelsToBits, type Pixels } from './bits';

// Dibuja los bits de vuelta en un canvas para que la vista previa muestre el resultado real.
function bitsToDataUrl(bits: Uint8Array, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(width, height);
  const bytesPerRow = Math.ceil(width / BYTE_BITS);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const black = bits[y * bytesPerRow + (x >> 3)] & (0x80 >> (x & 7));
      const v = black ? 0 : 255;
      img.data.set([v, v, v, 255], (y * width + x) * 4);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

/** Carga un archivo de imagen, lo escala a `maxWidth` puntos y lo convierte a bloque imprimible. */
export async function fileToImageBlock(
  file: File,
  maxWidth: number,
  options: { dither: boolean; align: Align },
): Promise<Omit<ImageBlock, 'type'>> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('No se pudo leer la imagen');
  });
  const scale = Math.min(1, maxWidth / bitmap.width);
  // El ancho debe ser múltiplo de 8 para que las filas queden alineadas a bytes.
  const width = Math.max(BYTE_BITS, Math.floor((bitmap.width * scale) / BYTE_BITS) * BYTE_BITS);
  const height = Math.max(1, Math.round(bitmap.height * (width / bitmap.width)));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const bits = pixelsToBits(ctx.getImageData(0, 0, width, height), options.dither);
  return {
    width,
    height,
    data: bytesToBase64(bits),
    align: options.align,
    previewUrl: bitsToDataUrl(bits, width, height),
  };
}
