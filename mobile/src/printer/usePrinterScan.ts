import { useCallback, useEffect, useRef, useState } from 'react';
import { scanForPrinters } from './blePrinter';
import type { PrinterCandidate } from './printerCandidates';

/** Búsqueda de impresoras mientras la hoja de selección está abierta. */
export function usePrinterScan(isActive: boolean) {
  const [candidates, setCandidates] = useState<PrinterCandidate[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    setCandidates([]);
    setIsScanning(true);
    stopRef.current = scanForPrinters(setCandidates, () => setIsScanning(false));
  }, [stop]);

  useEffect(() => {
    if (!isActive) return;
    start();
    return stop;
  }, [isActive, start, stop]);

  return { candidates, isScanning, rescan: start };
}
