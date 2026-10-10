import { describe, expect, test, vi } from 'vitest';
import {
  CAT_SERVICE_UUID,
  encodeForPrinter,
  flowControlState,
  isCatPrinterName,
  sameUuid,
  sendInChunks,
} from './printerLink';
import type { RasterCanvas } from './rasterize';

describe('UUID de Bluetooth', () => {
  test('compara la forma corta y la larga, sin importar mayúsculas', () => {
    expect(sameUuid('AE30', CAT_SERVICE_UUID)).toBe(true);
    expect(sameUuid('0000ae30-0000-1000-8000-00805f9b34fb', 'ae30')).toBe(true);
    expect(sameUuid('ae01', 'ae30')).toBe(false);
  });
});

test('reconoce impresoras "cat" por el nombre', () => {
  expect(isCatPrinterName('YT01')).toBe(true);
  expect(isCatPrinterName('PT-210')).toBe(false);
  expect(isCatPrinterName(null)).toBe(false);
});

describe('control de flujo de las impresoras "cat"', () => {
  test('0x10 pide pausa y 0x00 seguir', () => {
    expect(flowControlState(Uint8Array.of(0x51, 0x78, 0xae, 0x00, 0x01, 0x00, 0x10, 0x70, 0xff))).toBe('pause');
    expect(flowControlState(Uint8Array.of(0x51, 0x78, 0xae, 0x00, 0x01, 0x00, 0x00, 0x00, 0xff))).toBe('resume');
  });

  test('ignora otros paquetes', () => {
    expect(flowControlState(Uint8Array.of(0x51, 0x78, 0xa1, 0x00, 0x01, 0x00, 0x10))).toBeNull();
    expect(flowControlState(Uint8Array.of(0x51, 0x78))).toBeNull();
  });
});

describe('envío por trozos', () => {
  test('parte los bytes en trozos del tamaño pedido y espera entre trozos', async () => {
    const written: number[][] = [];
    const wait = vi.fn(async () => {});
    await sendInChunks(Uint8Array.from({ length: 250 }, (_, i) => i % 256), {
      chunkSize: 100,
      write: async (chunk) => {
        written.push([...chunk]);
      },
      pauseBetweenMs: 20,
      wait,
    });
    expect(written.map((c) => c.length)).toEqual([100, 100, 50]);
    expect(written[1][0]).toBe(100);
    expect(wait).toHaveBeenCalledWith(20);
  });

  test('mientras la impresora pide pausa no envía', async () => {
    let pausedChecks = 3;
    const write = vi.fn(async () => {});
    await sendInChunks(new Uint8Array(10), {
      chunkSize: 100,
      write,
      isPaused: () => pausedChecks-- > 0,
      wait: async () => {},
    });
    expect(pausedChecks).toBe(-1);
    expect(write).toHaveBeenCalledTimes(1);
  });

  test('si la pausa no termina, avisa que la impresora dejó de responder', async () => {
    let now = 0;
    await expect(
      sendInChunks(new Uint8Array(10), {
        chunkSize: 100,
        write: async () => {},
        isPaused: () => true,
        wait: async (ms) => {
          now += ms;
        },
        now: () => now,
      }),
    ).rejects.toThrow(/dejó de responder/);
  });
});

describe('ticket a bytes según la impresora', () => {
  const blocks = [{ type: 'text' as const, text: 'Hola', align: 'left' as const, bold: false, underline: false, size: 1 as const }];

  test('ESC/POS: texto con la tabla de caracteres de la impresora', () => {
    const bytes = encodeForPrinter({ paperWidth: 58, cut: false, blocks }, 'escpos', () => {
      throw new Error('ESC/POS no dibuja');
    });
    expect(bytes[0]).toBe(0x1b); // ESC @ (reiniciar)
  });

  test('"cat": dibuja el ticket como imagen con el lienzo de la plataforma', () => {
    const canvas = vi.fn((width: number, height: number): RasterCanvas => ({
      setFont: () => {},
      measureText: (text) => text.length * 12,
      fillText: () => {},
      fillRect: () => {},
      getPixels: () => ({ width, height, data: new Uint8ClampedArray(width * height * 4).fill(255) }),
    }));
    const bytes = encodeForPrinter({ paperWidth: 80, cut: true, darkness: 'max', blocks }, 'cat', canvas);
    expect(canvas).toHaveBeenCalledWith(384, expect.any(Number));
    expect([...bytes.slice(0, 2)]).toEqual([0x51, 0x78]);
  });
});
