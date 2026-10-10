// Generador de comandos ESC/POS. Funciones puras: reciben datos y devuelven bytes.
import { PAPER_CHARS, type Align, type Block, type PaperWidth, type PrintDocument } from '../types';
import { clamp, concatBytes, fromBase64 } from './bytes';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

// Tabla de códigos 2 = PC850 (multilingüe), cubre los caracteres del español.
const CODE_PAGE_PC850 = 2;
const CP850_MAP: Readonly<Record<string, number>> = Object.freeze({
  á: 0xa0, é: 0x82, í: 0xa1, ó: 0xa2, ú: 0xa3,
  Á: 0xb5, É: 0x90, Í: 0xd6, Ó: 0xe0, Ú: 0xe9,
  ñ: 0xa4, Ñ: 0xa5, ü: 0x81, Ü: 0x9a,
  '¿': 0xa8, '¡': 0xad, '°': 0xf8, '€': 0xd5,
  à: 0x85, è: 0x8a, ò: 0x95, ç: 0x87, Ç: 0x80,
});
const FALLBACK_CHAR = 0x3f; // '?'
const ALIGN: Readonly<Record<Align, number>> = Object.freeze({ left: 0, center: 1, right: 2 });
const MAX_SIZE = 8;
const FINAL_FEED_LINES = 3;

const bytes = (...values: number[]) => Uint8Array.from(values);

export function encodeText(text: string): Uint8Array {
  return Uint8Array.from(Array.from(text), (ch) => {
    const code = ch.codePointAt(0) ?? FALLBACK_CHAR;
    return code < 0x80 ? code : CP850_MAP[ch] ?? FALLBACK_CHAR;
  });
}

export const init = () => bytes(ESC, 0x40, ESC, 0x74, CODE_PAGE_PC850);
export const align = (value: Align) => bytes(ESC, 0x61, ALIGN[value] ?? ALIGN.left);
export const bold = (on: boolean) => bytes(ESC, 0x45, on ? 1 : 0);
export const underline = (on: boolean) => bytes(ESC, 0x2d, on ? 1 : 0);
export const feed = (lines = 1) => bytes(ESC, 0x64, clamp(lines, 0, 255));
export const cut = () => bytes(GS, 0x56, 0x42, 0x00);

/** Tamaño 1..8 en ancho y alto. */
export function size(width = 1, height = 1): Uint8Array {
  const w = clamp(width, 1, MAX_SIZE) - 1;
  const h = clamp(height, 1, MAX_SIZE) - 1;
  return bytes(GS, 0x21, (w << 4) | h);
}

export const textLine = (text: string) => concatBytes([encodeText(text), bytes(LF)]);

export const separator = (paperWidth: PaperWidth = 58, char = '-') =>
  textLine(char.repeat(PAPER_CHARS[paperWidth] ?? PAPER_CHARS[58]));

/** QR nativo (GS ( k). Funciona en la mayoría de impresoras ESC/POS modernas. */
export function qr(data: string, moduleSize = 6): Uint8Array {
  const payload = encodeText(data);
  const storeLen = payload.length + 3;
  return concatBytes([
    bytes(GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0x00), // modelo 2
    bytes(GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, clamp(moduleSize, 1, 16)),
    bytes(GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31), // corrección M
    bytes(GS, 0x28, 0x6b, storeLen & 0xff, storeLen >> 8, 0x31, 0x50, 0x30),
    payload,
    bytes(GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30),
  ]);
}

/** Imagen raster (GS v 0). `bits` son filas empaquetadas: 1 bit por punto, 1 = negro. */
export function rasterImage(width: number, height: number, bits: Uint8Array): Uint8Array {
  const bytesPerRow = Math.ceil(width / 8);
  if (bits.length !== bytesPerRow * height) {
    throw new Error(`La imagen debe tener ${bytesPerRow * height} bytes y tiene ${bits.length}`);
  }
  return concatBytes([
    bytes(GS, 0x76, 0x30, 0x00, bytesPerRow & 0xff, bytesPerRow >> 8, height & 0xff, height >> 8),
    bits,
  ]);
}

function encodeBlock(block: Block, doc: PrintDocument): Uint8Array {
  switch (block.type) {
    case 'text':
      return concatBytes([
        align(block.align), bold(block.bold), underline(block.underline), size(block.size, block.size),
        ...block.text.split('\n').map(textLine),
        size(1, 1), bold(false), underline(false),
      ]);
    case 'separator':
      return concatBytes([align('left'), separator(doc.paperWidth)]);
    case 'qr':
      return concatBytes([align(block.align), qr(block.data, block.moduleSize), feed(1)]);
    case 'image':
      return concatBytes([align(block.align), rasterImage(block.width, block.height, fromBase64(block.data))]);
    case 'feed':
      return feed(block.lines);
  }
}

/** Convierte un documento en los bytes a enviar a una impresora ESC/POS. */
export function buildDocument(doc: PrintDocument): Uint8Array {
  return concatBytes([
    init(),
    ...doc.blocks.map((block) => encodeBlock(block, doc)),
    feed(FINAL_FEED_LINES),
    ...(doc.cut ? [cut()] : []),
  ]);
}
