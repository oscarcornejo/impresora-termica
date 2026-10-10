// Conexión Bluetooth nativa con la impresora (CoreBluetooth en iPhone), sin navegador de por medio.
import BleManager, { BleState } from 'react-native-ble-manager';
import { CHUNK_DELAY_MS, CHUNK_SIZE, flowControlState, sameUuid, sendInChunks } from '@core/printerLink';
import type { PrinterProtocol } from '@core/types';
import { choosePrinterChannel, type PrinterChannel } from './printerChannel';
import { rankPrinterCandidates, type PrinterCandidate } from './printerCandidates';

const SCAN_SECONDS = 8;
/** En iPhone conectar no tiene límite de tiempo: si la impresora está apagada, se corta aquí. */
const CONNECT_TIMEOUT_MS = 10000;
/** Lo mínimo que acepta cualquier dispositivo BLE por escritura. */
const MIN_WRITE_BYTES = 20;

const NOT_A_PRINTER = 'Ese dispositivo no acepta datos para imprimir. Elige la impresora en la lista.';
const CONNECT_TIMEOUT = 'La impresora no respondió. Revisa que esté encendida y cerca, y vuelve a intentar.';

export { BleState };

export interface NativePrinter {
  id: string;
  name: string;
  protocol: PrinterProtocol;
  write: (data: Uint8Array) => Promise<void>;
  disconnect: () => Promise<void>;
}

let started: Promise<void> | null = null;

/** Prepara el Bluetooth del teléfono (la primera vez, iOS pide permiso). */
export const startBluetooth = () => (started ??= BleManager.start({ showAlert: false }));

export const bluetoothState = async () => {
  await startBluetooth();
  return BleManager.checkState();
};

export const onBluetoothStateChange = (callback: (state: BleState) => void) =>
  BleManager.onDidUpdateState(({ state }) => callback(state));

export const onPrinterDisconnected = (callback: (id: string) => void) =>
  BleManager.onDisconnectPeripheral(({ peripheral }) => callback(peripheral));

/** Busca dispositivos durante unos segundos. Devuelve la función para detener la búsqueda. */
export function scanForPrinters(onUpdate: (candidates: PrinterCandidate[]) => void, onDone: () => void): () => void {
  const found = new Map<string, Parameters<typeof rankPrinterCandidates>[0][number]>();
  const discovered = BleManager.onDiscoverPeripheral((device) => {
    found.set(device.id, device);
    onUpdate(rankPrinterCandidates([...found.values()]));
  });
  const stopped = BleManager.onStopScan(() => finish());
  let isDone = false;
  function finish() {
    if (isDone) return;
    isDone = true;
    discovered.remove();
    stopped.remove();
    onDone();
  }
  startBluetooth()
    .then(() => BleManager.scan({ seconds: SCAN_SECONDS }))
    .catch(finish);
  return () => {
    BleManager.stopScan().catch(() => {});
    finish();
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function maxWriteBytes(id: string, withoutResponse: boolean): Promise<number> {
  const read = withoutResponse
    ? BleManager.getMaximumWriteValueLengthForWithoutResponse(id)
    : BleManager.getMaximumWriteValueLengthForWithResponse(id);
  const max = await read.catch(() => MIN_WRITE_BYTES);
  return Math.max(MIN_WRITE_BYTES, Math.min(CHUNK_SIZE, max));
}

/** Escucha los avisos de pausa de las impresoras "cat". */
async function watchFlowControl(id: string, notify: NonNullable<PrinterChannel['notify']>) {
  let paused = false;
  const subscription = BleManager.onDidUpdateValueForCharacteristic((event) => {
    if (event.peripheral !== id || !sameUuid(event.characteristic, notify.characteristic)) return;
    const state = flowControlState(Uint8Array.from(event.value));
    if (state) paused = state === 'pause';
  });
  // Sin avisos igual se imprime: solo se pierde la pausa cuando la impresora se llena.
  await BleManager.startNotification(id, notify.service, notify.characteristic).catch(() => {});
  return { isPaused: () => paused, stop: () => subscription.remove() };
}

export async function connectPrinter(id: string, name: string): Promise<NativePrinter> {
  await startBluetooth();
  try {
    await withTimeout(BleManager.connect(id), CONNECT_TIMEOUT_MS, CONNECT_TIMEOUT);
  } catch (err) {
    BleManager.disconnect(id).catch(() => {});
    throw err;
  }
  const channel = choosePrinterChannel(name, await BleManager.retrieveServices(id));
  if (!channel) {
    await BleManager.disconnect(id).catch(() => {});
    throw new Error(NOT_A_PRINTER);
  }
  const { service, characteristic, withoutResponse } = channel.write;
  const chunkSize = await maxWriteBytes(id, withoutResponse);
  const flow = channel.notify ? await watchFlowControl(id, channel.notify) : null;

  const writeChunk = (chunk: Uint8Array) => {
    const bytes = Array.from(chunk);
    return withoutResponse
      ? BleManager.writeWithoutResponse(id, service, characteristic, bytes, bytes.length)
      : BleManager.write(id, service, characteristic, bytes, bytes.length);
  };

  return {
    id,
    name,
    protocol: channel.protocol,
    write: (data) =>
      sendInChunks(data, {
        chunkSize,
        write: writeChunk,
        pauseBetweenMs: withoutResponse ? CHUNK_DELAY_MS : 0,
        isPaused: flow?.isPaused,
      }),
    disconnect: async () => {
      flow?.stop();
      await BleManager.disconnect(id).catch(() => {});
    },
  };
}
