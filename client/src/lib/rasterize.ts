// Dibuja el ticket completo como un bitmap 1-bpp, para impresoras que solo
// entienden imágenes (protocolo "cat": YT01, GB01, MX05…).
import QRCode from 'qrcode';
import { bytesToBase64, pixelsToBits } from './image';
import type { Align, Block, ImageBlock, TextBlock } from './types';

export const RASTER_DOTS = 384;
const CHARS_PER_LINE = 32;
const FONT_SIZE = RASTER_DOTS / CHARS_PER_LINE / 0.6; // Un carácter monoespaciado ≈ 0.6em.
const LINE_HEIGHT = 1.25;
const FEED_LINE_DOTS = 24;
const QR_MARGIN_DOTS = 8;
// Umbral alto: los bordes suavizados del texto cuentan como negro y los trazos salen más gruesos.
const TEXT_THRESHOLD = 190;
const FONT_FAMILY = 'Menlo, ui-monospace, "SF Mono", Consolas, monospace';

interface Piece {
  height: number;
  draw: (ctx: CanvasRenderingContext2D, y: number) => void;
}

/** Corta una línea en trozos de `maxChars`, como hace la impresora al llegar al borde. */
export function wrapLine(line: string, maxChars: number): string[] {
  const chars = Array.from(line);
  if (chars.length <= maxChars) return [line];
  return Array.from({ length: Math.ceil(chars.length / maxChars) }, (_, i) =>
    chars.slice(i * maxChars, (i + 1) * maxChars).join(''),
  );
}

export function alignX(align: Align, contentWidth: number, width = RASTER_DOTS): number {
  if (align === 'center') return Math.round((width - contentWidth) / 2);
  if (align === 'right') return width - contentWidth;
  return 0;
}

function textPiece(block: Pick<TextBlock, 'text' | 'align' | 'bold' | 'underline' | 'size'>): Piece {
  const fontSize = FONT_SIZE * block.size;
  const lineHeight = Math.round(fontSize * LINE_HEIGHT);
  const maxChars = Math.floor(CHARS_PER_LINE / block.size);
  const lines = block.text.split('\n').flatMap((l) => wrapLine(l, maxChars));
  return {
    height: lines.length * lineHeight,
    draw: (ctx, y) => {
      ctx.font = `${block.bold ? 700 : 400} ${fontSize}px ${FONT_FAMILY}`;
      ctx.textBaseline = 'top';
      lines.forEach((line, i) => {
        const textWidth = Math.min(ctx.measureText(line).width, RASTER_DOTS);
        const x = alignX(block.align, textWidth);
        const top = y + i * lineHeight;
        ctx.fillText(line, x, top + (lineHeight - fontSize) / 2, RASTER_DOTS);
        if (block.underline) ctx.fillRect(x, top + lineHeight - 3, textWidth, 2);
      });
    },
  };
}

function qrPiece(block: Extract<Block, { type: 'qr' }>): Piece {
  const { modules } = QRCode.create(block.data, { errorCorrectionLevel: 'M' });
  const moduleSize = Math.max(1, Math.min(block.moduleSize, Math.floor(RASTER_DOTS / modules.size)));
  const size = modules.size * moduleSize;
  return {
    height: size + QR_MARGIN_DOTS * 2,
    draw: (ctx, y) => {
      const x0 = alignX(block.align, size);
      for (let row = 0; row < modules.size; row++) {
        for (let col = 0; col < modules.size; col++) {
          if (modules.get(row, col)) {
            ctx.fillRect(x0 + col * moduleSize, y + QR_MARGIN_DOTS + row * moduleSize, moduleSize, moduleSize);
          }
        }
      }
    },
  };
}

function imagePiece(block: ImageBlock): Piece {
  const bits = Uint8Array.from(atob(block.data), (c) => c.charCodeAt(0));
  const bytesPerRow = Math.ceil(block.width / 8);
  const width = Math.min(block.width, RASTER_DOTS);
  return {
    height: block.height,
    draw: (ctx, y) => {
      const x0 = alignX(block.align, width);
      for (let row = 0; row < block.height; row++) {
        for (let x = 0; x < width; x++) {
          if (bits[row * bytesPerRow + (x >> 3)] & (0x80 >> (x & 7))) ctx.fillRect(x0 + x, y + row, 1, 1);
        }
      }
    },
  };
}

function toPiece(block: Block): Piece {
  switch (block.type) {
    case 'text':
      return textPiece(block);
    case 'separator':
      return textPiece({ text: '-'.repeat(CHARS_PER_LINE), align: 'left', bold: false, underline: false, size: 1 });
    case 'qr':
      return qrPiece(block);
    case 'image':
      return imagePiece(block);
    case 'feed':
      return { height: block.lines * FEED_LINE_DOTS, draw: () => {} };
  }
}

/** Convierte todos los bloques en un único bloque de imagen de 384 puntos de ancho. */
export function rasterizeBlocks(blocks: Block[]): ImageBlock {
  const pieces = blocks.map(toPiece);
  const height = Math.max(1, pieces.reduce((sum, p) => sum + p.height, 0));

  const canvas = document.createElement('canvas');
  canvas.width = RASTER_DOTS;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no pudo crear el lienzo para dibujar el ticket');

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, RASTER_DOTS, height);
  ctx.fillStyle = '#000';
  pieces.reduce((y, piece) => {
    piece.draw(ctx, y);
    return y + piece.height;
  }, 0);

  const bits = pixelsToBits(ctx.getImageData(0, 0, RASTER_DOTS, height), false, TEXT_THRESHOLD);
  return { type: 'image', width: RASTER_DOTS, height, data: bytesToBase64(bits), align: 'left' };
}
