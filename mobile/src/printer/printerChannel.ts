// Dónde escribirle a la impresora, a partir de los servicios Bluetooth que expone.
import { CAT_NOTIFY_UUID, CAT_SERVICE_UUID, CAT_WRITE_UUID, isCatPrinterName, sameUuid } from '@core/printerLink';
import type { PrinterProtocol } from '@core/types';

interface CharacteristicInfo {
  service: string;
  characteristic: string;
  properties: Record<string, string | undefined>;
}

export interface ServiceInfo {
  characteristics?: CharacteristicInfo[];
}

interface Endpoint {
  service: string;
  characteristic: string;
}

export interface PrinterChannel {
  protocol: PrinterProtocol;
  write: Endpoint & { withoutResponse: boolean };
  /** Avisos de pausa de las impresoras "cat"; null si no hay. */
  notify: Endpoint | null;
}

const canWrite = (c: CharacteristicInfo) => Boolean(c.properties.Write || c.properties.WriteWithoutResponse);
const toWriteEndpoint = (c: CharacteristicInfo) => ({
  service: c.service,
  characteristic: c.characteristic,
  withoutResponse: Boolean(c.properties.WriteWithoutResponse),
});

const findCharacteristic = (all: CharacteristicInfo[], service: string, characteristic: string) =>
  all.find((c) => sameUuid(c.service, service) && sameUuid(c.characteristic, characteristic));

function catChannel(all: CharacteristicInfo[]): PrinterChannel | null {
  const write = findCharacteristic(all, CAT_SERVICE_UUID, CAT_WRITE_UUID);
  if (!write || !canWrite(write)) return null;
  const notify = findCharacteristic(all, CAT_SERVICE_UUID, CAT_NOTIFY_UUID);
  return {
    protocol: 'cat',
    write: toWriteEndpoint(write),
    notify: notify ? { service: notify.service, characteristic: notify.characteristic } : null,
  };
}

export function choosePrinterChannel(name: string | null | undefined, info: ServiceInfo): PrinterChannel | null {
  const all = info.characteristics ?? [];
  const cat = isCatPrinterName(name) ? catChannel(all) : null;
  if (cat) return cat;
  const writable = all.find(canWrite);
  return writable ? { protocol: 'escpos', write: toWriteEndpoint(writable), notify: null } : null;
}
