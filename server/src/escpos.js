// Generador de comandos ESC/POS. Funciones puras: reciben datos y devuelven Buffers.

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

// Tabla de códigos 2 = PC850 (multilingüe), cubre los caracteres del español.
const CODE_PAGE_PC850 = 2;
const CP850_MAP = Object.freeze({
  á: 0xa0, é: 0x82, í: 0xa1, ó: 0xa2, ú: 0xa3,
  Á: 0xb5, É: 0x90, Í: 0xd6, Ó: 0xe0, Ú: 0xe9,
  ñ: 0xa4, Ñ: 0xa5, ü: 0x81, Ü: 0x9a,
  '¿': 0xa8, '¡': 0xad, '°': 0xf8, '€': 0xd5,
  à: 0x85, è: 0x8a, ò: 0x95, ç: 0x87, Ç: 0x80,
});
const FALLBACK_CHAR = 0x3f; // '?'

export const ALIGN = Object.freeze({ left: 0, center: 1, right: 2 });

// Puntos por línea según ancho del papel (impresoras de 203 dpi).
export const PAPER_DOTS = Object.freeze({ 58: 384, 80: 576 });
// Caracteres por línea con la fuente A en tamaño normal.
export const PAPER_CHARS = Object.freeze({ 58: 32, 80: 48 });

export function encodeText(text) {
  const bytes = Array.from(text, (ch) => {
    const code = ch.codePointAt(0);
    if (code < 0x80) return code;
    return CP850_MAP[ch] ?? FALLBACK_CHAR;
  });
  return Buffer.from(bytes);
}

export const init = () => Buffer.from([ESC, 0x40, ESC, 0x74, CODE_PAGE_PC850]);
export const align = (value) => Buffer.from([ESC, 0x61, ALIGN[value] ?? ALIGN.left]);
export const bold = (on) => Buffer.from([ESC, 0x45, on ? 1 : 0]);
export const underline = (on) => Buffer.from([ESC, 0x2d, on ? 1 : 0]);
export const feed = (lines = 1) => Buffer.from([ESC, 0x64, clamp(lines, 0, 255)]);
export const cut = () => Buffer.from([GS, 0x56, 0x42, 0x00]);

// Tamaño 1..8 en ancho y alto.
export function size(width = 1, height = 1) {
  const w = clamp(width, 1, 8) - 1;
  const h = clamp(height, 1, 8) - 1;
  return Buffer.from([GS, 0x21, (w << 4) | h]);
}

export function textLine(text) {
  return Buffer.concat([encodeText(text), Buffer.from([LF])]);
}

export function separator(paperWidth = 58, char = '-') {
  return textLine(char.repeat(PAPER_CHARS[paperWidth] ?? PAPER_CHARS[58]));
}

// QR nativo (GS ( k). Funciona en la mayoría de impresoras ESC/POS modernas.
export function qr(data, moduleSize = 6) {
  const payload = encodeText(data);
  const storeLen = payload.length + 3;
  return Buffer.concat([
    Buffer.from([GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0x00]), // modelo 2
    Buffer.from([GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, clamp(moduleSize, 1, 16)]),
    Buffer.from([GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31]), // corrección M
    Buffer.from([GS, 0x28, 0x6b, storeLen & 0xff, storeLen >> 8, 0x31, 0x50, 0x30]),
    payload,
    Buffer.from([GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30]),
  ]);
}

// Imagen raster (GS v 0). `bits` son filas empaquetadas: 1 bit por punto, 1 = negro.
export function rasterImage(width, height, bits) {
  const bytesPerRow = Math.ceil(width / 8);
  if (bits.length !== bytesPerRow * height) {
    throw new Error(
      `La imagen debe tener ${bytesPerRow * height} bytes y tiene ${bits.length}`,
    );
  }
  const header = Buffer.from([
    GS, 0x76, 0x30, 0x00,
    bytesPerRow & 0xff, bytesPerRow >> 8,
    height & 0xff, height >> 8,
  ]);
  return Buffer.concat([header, Buffer.from(bits)]);
}

const BLOCK_ENCODERS = {
  text: (block) =>
    Buffer.concat([
      align(block.align),
      bold(block.bold),
      underline(block.underline),
      size(block.size, block.size),
      ...block.text.split('\n').map(textLine),
      size(1, 1),
      bold(false),
      underline(false),
    ]),
  separator: (_block, doc) => Buffer.concat([align('left'), separator(doc.paperWidth)]),
  qr: (block) => Buffer.concat([align(block.align), qr(block.data, block.moduleSize), feed(1)]),
  image: (block) =>
    Buffer.concat([
      align(block.align),
      rasterImage(block.width, block.height, Buffer.from(block.data, 'base64')),
    ]),
  feed: (block) => feed(block.lines),
};

// Convierte un documento { paperWidth, blocks, cut } en el Buffer a enviar.
export function buildDocument(doc) {
  const body = doc.blocks.map((block) => BLOCK_ENCODERS[block.type](block, doc));
  return Buffer.concat([
    init(),
    ...body,
    feed(3),
    ...(doc.cut ? [cut()] : []),
  ]);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
