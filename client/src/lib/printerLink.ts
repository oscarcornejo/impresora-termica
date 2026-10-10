// Lo que comparten la web (Web Bluetooth) y la app de iPhone (Bluetooth nativo) para hablar con la impresora:
// cómo reconocerla, cómo leer sus pausas y cómo enviarle el ticket por trozos.
import { withTearLine } from './blocks';
import { buildCatDocument } from './encoding/catprinter';
import { buildDocument } from './encoding/escpos';
import { rasterizeBlocks, type CreateRasterCanvas } from './rasterize';
import type { PrintDocument, PrinterProtocol } from './types';

/** "Cat printers": protocolo propio (solo imágenes). */
const CAT_PRINTER_NAME = /^(YT01|GB0[1-3]|GT01|MX\d{2})/i;
export const CAT_SERVICE_UUID = 'ae30';
export const CAT_WRITE_UUID = 'ae01';
export const CAT_NOTIFY_UUID = 'ae02';

// Paquete de control de flujo: 51 78 AE 00 01 00 <estado> … (0x10 = pausa, 0x00 = seguir).
const FLOW_CONTROL_CMD = 0xae;
const FLOW_PAUSE = 0x10;
const FLOW_CMD_INDEX = 2;
const FLOW_STATE_INDEX = 6;

export const CHUNK_SIZE = 100;
/** Sin confirmación de la impresora, una pausa entre trozos evita llenar su búfer. */
export const CHUNK_DELAY_MS = 20;
const PAUSE_POLL_MS = 50;
const MAX_PAUSE_MS = 15000;
const STALLED = 'La impresora dejó de responder. Revisa que tenga papel y batería, y vuelve a intentar.';

const BASE_UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';

/** UUID de 16 bits ("ae30") a su forma completa, en minúsculas. */
function fullUuid(uuid: string): string {
  const lower = uuid.toLowerCase();
  if (/^[0-9a-f]{4}$/.test(lower)) return `0000${lower}${BASE_UUID_SUFFIX}`;
  if (/^[0-9a-f]{8}$/.test(lower)) return `${lower}${BASE_UUID_SUFFIX}`;
  return lower;
}

export const sameUuid = (a: string, b: string) => fullUuid(a) === fullUuid(b);

export const isCatPrinterName = (name: string | null | undefined) => CAT_PRINTER_NAME.test(name ?? '');

/** Lee un aviso de la impresora "cat": pide pausa, permite seguir, o no es de control de flujo (null). */
export function flowControlState(bytes: Uint8Array): 'pause' | 'resume' | null {
  if (bytes.length <= FLOW_STATE_INDEX || bytes[FLOW_CMD_INDEX] !== FLOW_CONTROL_CMD) return null;
  return bytes[FLOW_STATE_INDEX] === FLOW_PAUSE ? 'pause' : 'resume';
}

interface SendOptions {
  chunkSize: number;
  write: (chunk: Uint8Array<ArrayBuffer>) => Promise<void>;
  /** Pausa tras cada trozo (0 si la impresora confirma cada escritura). */
  pauseBetweenMs?: number;
  isPaused?: () => boolean;
  wait?: (ms: number) => Promise<void>;
  now?: () => number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function sendInChunks(data: Uint8Array, options: SendOptions): Promise<void> {
  const { chunkSize, write, pauseBetweenMs = 0, isPaused = () => false, wait = sleep, now = Date.now } = options;
  for (let offset = 0; offset < data.length; offset += chunkSize) {
    const pausedAt = now();
    while (isPaused()) {
      if (now() - pausedAt > MAX_PAUSE_MS) throw new Error(STALLED);
      await wait(PAUSE_POLL_MS);
    }
    await write(data.slice(offset, offset + chunkSize));
    if (pauseBetweenMs > 0) await wait(pauseBetweenMs);
  }
}

// Las impresoras "cat" no entienden texto: se les envía el ticket entero como una imagen.
function adaptToProtocol(doc: PrintDocument, protocol: PrinterProtocol, createCanvas: CreateRasterCanvas): PrintDocument {
  if (protocol === 'escpos') return { ...doc, protocol };
  // Sin cortador: `cut` agrega la línea ✂ y se avanza papel extra para rasgar.
  const blocks = doc.cut ? withTearLine(doc.blocks) : doc.blocks;
  return { protocol, darkness: doc.darkness, paperWidth: 58, cut: doc.cut, blocks: [rasterizeBlocks(blocks, createCanvas)] };
}

/** Bytes listos para enviar a la impresora según su protocolo. */
export function encodeForPrinter(doc: PrintDocument, protocol: PrinterProtocol, createCanvas: CreateRasterCanvas): Uint8Array {
  const adapted = adaptToProtocol(doc, protocol, createCanvas);
  return adapted.protocol === 'cat' ? buildCatDocument(adapted) : buildDocument(adapted);
}
