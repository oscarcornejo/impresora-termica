import { useCallback, useEffect, useRef, useState } from 'react';
import { encodeForPrinter } from '@core/printerLink';
import type { PrintDocument, PrinterProtocol } from '@core/types';
import {
  BleState,
  bluetoothState,
  connectPrinter,
  onBluetoothStateChange,
  onPrinterDisconnected,
  type NativePrinter,
} from './blePrinter';
import { forgetPrinter, loadSavedPrinter, savePrinter, type SavedPrinter } from './savedPrinter';
import { createSkiaRasterCanvas } from './skiaRasterCanvas';

const LOST_CONNECTION = 'Se perdió la conexión con la impresora. Revisa que esté encendida y cerca, conéctala de nuevo y reintenta.';
const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Algo falló sin dar detalles. Vuelve a intentar.');

export interface PrinterState {
  name: string | null;
  protocol: PrinterProtocol;
  isConnected: boolean;
  bluetooth: BleState | null;
  busy: string | null;
  error: string | null;
  connect: (printer: SavedPrinter) => Promise<boolean>;
  disconnect: () => Promise<void>;
  print: (doc: PrintDocument) => Promise<boolean>;
  clearError: () => void;
}

/** Impresora conectada por Bluetooth nativo: la app arma los bytes y los envía directo. */
export function usePrinter(): PrinterState {
  const [printer, setPrinter] = useState<NativePrinter | null>(null);
  const printerRef = useRef<NativePrinter | null>(null);
  const [bluetooth, setBluetooth] = useState<BleState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasTriedSaved = useRef(false);

  const use = (next: NativePrinter | null) => {
    printerRef.current = next;
    setPrinter(next);
  };

  // Envuelve una acción con estado de carga y manejo de errores. `isQuiet`: falla sin mostrar error.
  const run = useCallback(async (label: string, action: () => Promise<void>, isQuiet = false): Promise<boolean> => {
    setBusy(label);
    if (!isQuiet) setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      if (!isQuiet) setError(errorMessage(err));
      return false;
    } finally {
      setBusy(null);
    }
  }, []);

  const connectTo = useCallback(
    (target: SavedPrinter, isQuiet = false) =>
      run(`Conectando con ${target.name}…`, async () => {
        await printerRef.current?.disconnect();
        use(null);
        const connected = await connectPrinter(target.id, target.name);
        use(connected);
        await savePrinter(target);
      }, isQuiet),
    [run],
  );

  useEffect(() => {
    bluetoothState().then(setBluetooth, () => setBluetooth(BleState.Unsupported));
    const stateChanges = onBluetoothStateChange(setBluetooth);
    const disconnections = onPrinterDisconnected((id) => {
      if (printerRef.current?.id === id) use(null);
    });
    return () => {
      stateChanges.remove();
      disconnections.remove();
    };
  }, []);

  // Con el Bluetooth listo, vuelve a conectar la última impresora (una vez por apertura).
  useEffect(() => {
    if (bluetooth !== BleState.On || hasTriedSaved.current) return;
    hasTriedSaved.current = true;
    loadSavedPrinter().then((saved) => saved && !printerRef.current && connectTo(saved, true));
  }, [bluetooth, connectTo]);

  const disconnect = useCallback(async () => {
    await run('Desconectando…', async () => {
      await printerRef.current?.disconnect();
      use(null);
      await forgetPrinter();
    });
  }, [run]);

  const print = useCallback(
    (doc: PrintDocument) =>
      run('Imprimiendo…', async () => {
        const current = printerRef.current;
        if (!current) throw new Error(LOST_CONNECTION);
        await current.write(encodeForPrinter(doc, current.protocol, createSkiaRasterCanvas));
      }),
    [run],
  );

  return {
    name: printer?.name ?? null,
    protocol: printer?.protocol ?? 'escpos',
    isConnected: printer !== null,
    bluetooth,
    busy,
    error,
    connect: connectTo,
    disconnect,
    print,
    clearError: () => setError(null),
  };
}
