// Lienzo Skia para dibujar el ticket de las impresoras "cat" (en la web es un <canvas>).
import { AlphaType, ColorType, matchFont, Skia, type SkFont } from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import type { CreateRasterCanvas } from '@core/rasterize';

const FONT_FAMILY = Platform.select({ ios: 'Menlo', default: 'monospace' });

const fontOf = (size: number, isBold: boolean): SkFont =>
  matchFont({ fontFamily: FONT_FAMILY, fontSize: size, fontWeight: isBold ? 'bold' : 'normal' });

export const createSkiaRasterCanvas: CreateRasterCanvas = (width, height) => {
  const surface = Skia.Surface.Make(width, height);
  if (!surface) throw new Error('No se pudo preparar el dibujo del ticket. Cierra la app y vuelve a intentar.');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('white'));
  const ink = Skia.Paint();
  ink.setColor(Skia.Color('black'));
  ink.setAntiAlias(true);
  let font = fontOf(20, false);

  return {
    setFont: (size, isBold) => {
      font = fontOf(size, isBold);
    },
    measureText: (text) => font.measureText(text).width,
    // Skia dibuja desde la línea base: se baja el texto lo que mide su parte superior.
    fillText: (text, x, top) => canvas.drawText(text, x, top - font.getMetrics().ascent, ink, font),
    fillRect: (x, y, w, h) => canvas.drawRect(Skia.XYWHRect(x, y, w, h), ink),
    getPixels: () => {
      surface.flush();
      const pixels = surface
        .makeImageSnapshot()
        .readPixels(0, 0, { width, height, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul });
      if (!pixels) throw new Error('No se pudo leer el dibujo del ticket. Vuelve a intentar.');
      return { width, height, data: new Uint8ClampedArray(pixels) };
    },
  };
};
