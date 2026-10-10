// Conexión directa navegador → impresora BLE (Chrome/Edge en escritorio y Android).
import type { PrinterProtocol } from './types';
import { writeChunk } from './bluetoothSupport';
import { CHUNK_DELAY_MS, CHUNK_SIZE, flowControlState, isCatPrinterName, sendInChunks } from './printerLink';

const CAT_SERVICE = 0xae30;
const CAT_WRITE = 0xae01;
const CAT_NOTIFY = 0xae02;

// Servicios GATT habituales en impresoras térmicas; deben declararse para poder usarlos.
const PRINTER_SERVICES: BluetoothServiceUUID[] = [
  0x18f0,
  0xff00,
  0xffe0,
  0xfee7,
  CAT_SERVICE,
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
];

export interface BrowserPrinter {
  name: string;
  protocol: PrinterProtocol;
  isConnected: () => boolean;
  write: (data: Uint8Array) => Promise<void>;
  disconnect: () => void;
}

export const isWebBluetoothAvailable = () =>
  typeof navigator !== 'undefined' && 'bluetooth' in navigator;

export { isCatPrinterName };

async function findWritableCharacteristic(server: BluetoothRemoteGATTServer) {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    const characteristics = await service.getCharacteristics().catch(() => []);
    const writable = characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse,
    );
    if (writable) return writable;
  }
  return null;
}

interface CatChannel {
  write: BluetoothRemoteGATTCharacteristic;
  isPaused: () => boolean;
}

async function openCatChannel(server: BluetoothRemoteGATTServer): Promise<CatChannel | null> {
  const service = await server.getPrimaryService(CAT_SERVICE).catch(() => null);
  if (!service) return null;
  const write = await service.getCharacteristic(CAT_WRITE);

  let paused = false;
  const notify = await service.getCharacteristic(CAT_NOTIFY).catch(() => null);
  if (notify) {
    notify.addEventListener('characteristicvaluechanged', () => {
      const value = notify.value;
      const state = value ? flowControlState(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)) : null;
      if (state) paused = state === 'pause';
    });
    await notify.startNotifications().catch(() => {});
  }
  return { write, isPaused: () => paused };
}

export async function connectBrowserPrinter(): Promise<BrowserPrinter> {
  if (!isWebBluetoothAvailable()) {
    throw new Error('Este navegador no puede conectarse a impresoras Bluetooth. En iPhone usa Bluefy; en Android o computador, Chrome.');
  }
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_SERVICES,
  });
  if (!device.gatt) throw new Error('El dispositivo no expone GATT');

  const server = await device.gatt.connect();
  const cat = isCatPrinterName(device.name) ? await openCatChannel(server) : null;
  const characteristic = cat?.write ?? (await findWritableCharacteristic(server));
  if (!characteristic) {
    server.disconnect();
    throw new Error('No se encontró una característica de escritura compatible');
  }
  const withoutResponse = characteristic.properties.writeWithoutResponse;
  const isPaused = cat?.isPaused ?? (() => false);

  return {
    name: device.name ?? 'Impresora BLE',
    protocol: cat ? 'cat' : 'escpos',
    isConnected: () => server.connected,
    write: (data) =>
      sendInChunks(data, {
        chunkSize: CHUNK_SIZE,
        write: (chunk) => writeChunk(characteristic, chunk, withoutResponse),
        pauseBetweenMs: withoutResponse ? CHUNK_DELAY_MS : 0,
        isPaused,
      }),
    disconnect: () => server.disconnect(),
  };
}
