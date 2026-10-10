// Lienzo del navegador para dibujar el ticket de las impresoras "cat".
import type { CreateRasterCanvas } from './rasterize';

const FONT_FAMILY = 'Menlo, ui-monospace, "SF Mono", Consolas, monospace';

export const createDomRasterCanvas: CreateRasterCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no pudo crear el lienzo para dibujar el ticket');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'top';
  return {
    setFont: (size, isBold) => {
      ctx.font = `${isBold ? 700 : 400} ${size}px ${FONT_FAMILY}`;
    },
    measureText: (text) => ctx.measureText(text).width,
    fillText: (text, x, top, maxWidth) => ctx.fillText(text, x, top, maxWidth),
    fillRect: (x, y, w, h) => ctx.fillRect(x, y, w, h),
    getPixels: () => ctx.getImageData(0, 0, width, height),
  };
};
