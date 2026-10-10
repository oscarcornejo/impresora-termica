// Dispositivos Bluetooth encontrados, ordenados para que la impresora quede arriba.
import { isCatPrinterName } from '@core/printerLink';

interface ScannedDevice {
  id: string;
  name?: string;
  rssi: number;
  advertising: { localName?: string };
}

export interface PrinterCandidate {
  id: string;
  name: string;
  rssi: number;
  isLikelyPrinter: boolean;
}

const PRINTER_NAME = /print|pos|^pt-|^mtp|^rpp|^xp-|^bt-?p|^mpt/i;

const isLikelyPrinterName = (name: string) => isCatPrinterName(name) || PRINTER_NAME.test(name);

export function rankPrinterCandidates(devices: ScannedDevice[]): PrinterCandidate[] {
  return devices
    .map((d) => ({ id: d.id, name: (d.name ?? d.advertising.localName ?? '').trim(), rssi: d.rssi }))
    .filter((d) => d.name.length > 0)
    .map((d) => ({ ...d, isLikelyPrinter: isLikelyPrinterName(d.name) }))
    .sort((a, b) => Number(b.isLikelyPrinter) - Number(a.isLikelyPrinter) || b.rssi - a.rssi);
}
