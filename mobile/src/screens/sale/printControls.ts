import type { EditorBlock, PaperWidth } from '@core/types';

/** Lo que la pantalla de venta necesita saber y hacer con la impresora. */
export interface PrintControls {
  paperWidth: PaperWidth;
  /** Impresora sin cortador: el comprobante termina con la línea ✂. */
  hasTearLine: boolean;
  isConnected: boolean;
  busyLabel: string | null;
  canPrint: boolean;
  /** El último envío falló: se muestra junto al botón, con opción de reintentar. */
  printError: string | null;
  notice: string | null;
  openPrinter: () => void;
  print: (blocks: EditorBlock[]) => Promise<boolean>;
}
