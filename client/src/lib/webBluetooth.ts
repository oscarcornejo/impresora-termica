// Conexión directa navegador → impresora BLE (Chrome/Edge en escritorio y Android).
import type { PrinterProtocol } from './types';

const CHUNK_SIZE = 100;
const CHUNK_DELAY_MS = 20;
const PAUSE_POLL_MS = 50;
const MAX_PAUSE_MS = 15000;

// "Cat printers": protocolo propio (solo imágenes), servicio 0xAE30.
const CAT_PRINTER_NAME = /^(YT01|GB0[1-3]|GT01|MX\d{2})/i;
const CAT_SERVICE = 0xae30;
const CAT_WRITE = 0xae01;
const CAT_NOTIFY = 0xae02;
// Paquete de control de flujo de la impresora: 51 78 AE 00 01 00 <estado> … (0x10 = pausa, 0x00 = seguir).
const FLOW_CONTROL_CMD = 0xae;
const FLOW_PAUSE = 0x10;

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

export const isCatPrinterName = (name: string | undefined) => CAT_PRINTER_NAME.test(name ?? '');

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
      if (value && value.byteLength > 6 && value.getUint8(2) === FLOW_CONTROL_CMD) {
        paused = value.getUint8(6) === FLOW_PAUSE;
      }
    });
    await notify.startNotifications().catch(() => {});
  }
  return { write, isPaused: () => paused };
}

async function waitWhilePaused(isPaused: () => boolean) {
  const start = Date.now();
  while (isPaused()) {
    if (Date.now() - start > MAX_PAUSE_MS) throw new Error('La impresora dejó de responder. Revisa que tenga papel y batería, y vuelve a intentar.');
    await delay(PAUSE_POLL_MS);
  }
}

export async function connectBrowserPrinter(): Promise<BrowserPrinter> {
  if (!isWebBluetoothAvailable()) {
    throw new Error('Este navegador no soporta Web Bluetooth. Usa Chrome o Edge.');
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
    write: async (data) => {
      for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
        await waitWhilePaused(isPaused);
        const chunk = data.slice(offset, offset + CHUNK_SIZE);
        if (withoutResponse) {
          await characteristic.writeValueWithoutResponse(chunk);
          await delay(CHUNK_DELAY_MS);
        } else {
          await characteristic.writeValueWithResponse(chunk);
        }
      }
    },
    disconnect: () => server.disconnect(),
  };
}
