import { useCallback, useRef, useState } from 'react';
import { connectBrowserPrinter, type BrowserPrinter } from './webBluetooth';
import { rasterizeBlocks } from './rasterize';
import { withTearLine } from './blocks';
import { buildDocument } from './encoding/escpos';
import { buildCatDocument } from './encoding/catprinter';
import type { PrintDocument, PrinterProtocol, PrinterStatus } from './types';

const DISCONNECTED: PrinterStatus = { connected: false, transport: null, id: null };
const LOST_CONNECTION = 'Se perdió la conexión con la impresora. Revisa que esté encendida y cerca, conéctala de nuevo y reintenta.';

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Algo falló sin dar detalles. Vuelve a intentar.');
// El usuario cerró el selector de Bluetooth: no es un error que mostrar.
const isUserCancel = (err: unknown) => err instanceof DOMException && err.name === 'NotFoundError';

// Las impresoras "cat" no entienden texto: se les envía el ticket entero como una imagen.
function adaptToProtocol(doc: PrintDocument, protocol: PrinterProtocol): PrintDocument {
  if (protocol === 'escpos') return { ...doc, protocol };
  // Sin cortador: `cut` agrega la línea ✂ y se avanza papel extra para rasgar.
  const blocks = doc.cut ? withTearLine(doc.blocks) : doc.blocks;
  return { protocol, darkness: doc.darkness, paperWidth: 58, cut: doc.cut, blocks: [rasterizeBlocks(blocks)] };
}

const encode = (doc: PrintDocument) => (doc.protocol === 'cat' ? buildCatDocument(doc) : buildDocument(doc));

/** Impresora conectada por Web Bluetooth: el navegador arma los bytes y los envía directo. */
export function usePrinter() {
  const [status, setStatus] = useState<PrinterStatus>(DISCONNECTED);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<PrinterProtocol>('escpos');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const browserPrinter = useRef<BrowserPrinter | null>(null);

  // Envuelve una acción asíncrona con estado de carga y manejo de errores.
  const run = useCallback(async <T,>(label: string, action: () => Promise<T>): Promise<T | undefined> => {
    setBusy(label);
    setError(null);
    try {
      return await action();
    } catch (err) {
      if (!isUserCancel(err)) setError(errorMessage(err));
      return undefined;
    } finally {
      setBusy(null);
    }
  }, []);

  const connect = () =>
    run('Conectando por Bluetooth…', async () => {
      browserPrinter.current?.disconnect();
      const printer = await connectBrowserPrinter();
      browserPrinter.current = printer;
      setConnectedName(printer.name);
      setProtocol(printer.protocol);
      setStatus({ connected: true, transport: 'ble', id: printer.name });
    });

  const disconnect = () =>
    run('Desconectando…', async () => {
      browserPrinter.current?.disconnect();
      browserPrinter.current = null;
      setStatus(DISCONNECTED);
      setConnectedName(null);
      setProtocol('escpos');
    });

  const print = (doc: PrintDocument) =>
    run('Imprimiendo…', async () => {
      const printer = browserPrinter.current;
      if (!printer?.isConnected()) throw new Error(LOST_CONNECTION);
      const bytes = encode(adaptToProtocol(doc, printer.protocol));
      await printer.write(bytes);
      return { bytes: bytes.length };
    });

  return {
    status, connectedName, protocol, busy, error,
    clearError: () => setError(null),
    connect, disconnect, print,
  };
}
