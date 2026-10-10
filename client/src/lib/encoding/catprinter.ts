// Protocolo de las "cat printers" BLE (YT01, GB01, MX05…). No usan ESC/POS:
// solo imprimen bitmaps de 384 puntos por línea, enviados en paquetes
// 51 78 CMD 00 LEN_LO LEN_HI DATOS CRC8 FF.
import type { Align, Block, Darkness, ImageBlock, PrintDocument } from '../types';
import { concatBytes, fromBase64 } from './bytes';

export const CAT_PRINTER_DOTS = 384;
const BYTES_PER_LINE = CAT_PRINTER_DOTS / 8;

const CMD = Object.freeze({
  FEED: 0xa1,
  DRAW_LINE: 0xa2,
  GET_STATE: 0xa3,
  SET_QUALITY: 0xa4,
  LATTICE: 0xa6,
  UPDATE_DEVICE: 0xa9,
  SET_ENERGY: 0xaf,
  SET_SPEED: 0xbd,
  APPLY_ENERGY: 0xbe,
});

const QUALITY_200_DPI = 0x32;
/** Energía del cabezal térmico: 0x0000 = claro … 0xffff = oscuro. */
export const ENERGY_BY_DARKNESS: Readonly<Record<Darkness, number>> = Object.freeze({ normal: 0xc000, dark: 0xe000, max: 0xffff });
const DEFAULT_DARKNESS: Darkness = 'max';
const PRINT_SPEED = 0x20;
const LATTICE_START = [0xaa, 0x55, 0x17, 0x38, 0x44, 0x5f, 0x5f, 0x5f, 0x44, 0x38, 0x2c];
const LATTICE_END = [0xaa, 0x55, 0x17, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17];
const DOTS_PER_FEED_LINE = 24;
const FINAL_FEED_DOTS = 0x30;
// Sin cortador: con `cut` se avanza más papel para que el ticket pase el borde dentado.
const TEAR_FEED_PACKETS = 2;

// CRC-8 (polinomio 0x07, inicial 0x00).
const CRC8_TABLE = Uint8Array.from({ length: 256 }, (_, n) => {
  let crc = n;
  for (let bit = 0; bit < 8; bit++) crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
  return crc;
});

export const crc8 = (data: ArrayLike<number>) => Array.from(data).reduce((crc, b) => CRC8_TABLE[(crc ^ b) & 0xff], 0);

export function packet(cmd: number, data: ArrayLike<number>): Uint8Array {
  const payload = Uint8Array.from(data);
  return concatBytes([
    Uint8Array.of(0x51, 0x78, cmd, 0x00, payload.length & 0xff, payload.length >> 8),
    payload,
    Uint8Array.of(crc8(payload), 0xff),
  ]);
}

const uint16 = (value: number) => [value & 0xff, (value >> 8) & 0xff];

// Estas impresoras leen el bit menos significativo como el punto de más a la izquierda.
const REVERSED_BITS = Uint8Array.from({ length: 256 }, (_, n) => {
  let r = 0;
  for (let bit = 0; bit < 8; bit++) r |= ((n >> bit) & 1) << (7 - bit);
  return r;
});

/**
 * Convierte una fila de bits MSB-primero (formato del bloque image) de `width` puntos
 * a una línea de 48 bytes, alineada según `align`.
 */
export function toPrinterLine(row: Uint8Array, width: number, align: Align = 'left'): Uint8Array {
  const line = new Uint8Array(BYTES_PER_LINE);
  const free = CAT_PRINTER_DOTS - width;
  const offset = align === 'center' ? Math.floor(free / 2) : align === 'right' ? free : 0;
  for (let x = 0; x < width; x++) {
    const isBlack = row[x >> 3] & (0x80 >> (x & 7));
    const target = x + offset;
    if (isBlack && target >= 0 && target < CAT_PRINTER_DOTS) line[target >> 3] |= 0x80 >> (target & 7);
  }
  return line.map((b) => REVERSED_BITS[b]);
}

function imageLines(block: ImageBlock): Uint8Array[] {
  const bits = fromBase64(block.data);
  const bytesPerRow = Math.ceil(block.width / 8);
  return Array.from({ length: block.height }, (_, y) =>
    packet(CMD.DRAW_LINE, toPrinterLine(bits.subarray(y * bytesPerRow, (y + 1) * bytesPerRow), block.width, block.align)),
  );
}

function encodeBlock(block: Block): Uint8Array[] {
  if (block.type === 'image') return imageLines(block);
  if (block.type === 'feed') return [packet(CMD.FEED, uint16(block.lines * DOTS_PER_FEED_LINE))];
  throw new Error(`El protocolo cat solo imprime imágenes (bloque "${block.type}")`);
}

/** Convierte un documento (ya rasterizado) en los bytes para una impresora cat. */
export function buildCatDocument(doc: PrintDocument): Uint8Array {
  const tooWide = doc.blocks.find((b) => b.type === 'image' && b.width > CAT_PRINTER_DOTS);
  if (tooWide) throw new Error(`La imagen supera los ${CAT_PRINTER_DOTS} puntos de ancho`);
  const finalFeed = () => packet(CMD.FEED, uint16(FINAL_FEED_DOTS));

  return concatBytes([
    packet(CMD.GET_STATE, [0x00]),
    packet(CMD.SET_QUALITY, [QUALITY_200_DPI]),
    packet(CMD.SET_ENERGY, uint16(ENERGY_BY_DARKNESS[doc.darkness ?? DEFAULT_DARKNESS])),
    packet(CMD.APPLY_ENERGY, [0x01]),
    packet(CMD.UPDATE_DEVICE, [0x00]),
    packet(CMD.LATTICE, LATTICE_START),
    packet(CMD.SET_SPEED, [PRINT_SPEED]),
    ...doc.blocks.flatMap(encodeBlock),
    finalFeed(),
    finalFeed(),
    ...(doc.cut ? Array.from({ length: TEAR_FEED_PACKETS }, finalFeed) : []),
    packet(CMD.LATTICE, LATTICE_END),
    packet(CMD.GET_STATE, [0x00]),
  ]);
}
