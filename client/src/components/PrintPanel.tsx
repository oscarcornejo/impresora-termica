import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { ReceiptPreview } from './ReceiptPreview';
import { withTearLine } from '../lib/blocks';
import type { EditorBlock, PaperWidth } from '../lib/types';

/** Lo que una pantalla necesita para previsualizar e imprimir, entregado por App. */
export interface PrintControls {
  paperWidth: PaperWidth;
  /** Impresora sin cortador con "corte" activado: se muestra la línea ✂. */
  hasTearLine: boolean;
  canPrint: boolean;
  isConnected: boolean;
  busyLabel: string | null;
  /** Abre el panel de impresora (conexión y papel). */
  openPrinter: () => void;
  notice: string | null;
  /** Error del último envío a la impresora, si falló. */
  printError: string | null;
  print: (blocks: EditorBlock[]) => Promise<boolean>;
}

interface PrintPanelProps {
  blocks: EditorBlock[];
  controls: PrintControls;
  emptyMessage?: string;
  printLabel?: string;
  actions?: ReactNode;
}

/**
 * Vista previa + imprimir. En escritorio es una columna fija junto al editor; en pantallas angostas es una barra
 * fija abajo con "Imprimir" a mano y la vista previa en un cajón que se abre sobre ella.
 */
export function PrintPanel({ blocks, controls, emptyMessage, printLabel = 'Imprimir', actions }: PrintPanelProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isEmpty = blocks.length === 0;
  const previewBlocks = controls.hasTearLine ? withTearLine(blocks) : blocks;

  useEffect(() => {
    if (!isPreviewOpen) return;
    const closeOnEscape = (e: KeyboardEvent) => e.key === 'Escape' && setIsPreviewOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isPreviewOpen]);

  return (
    <section className={`col-preview ${isPreviewOpen ? 'is-open' : ''}`} aria-label="Vista previa e impresión">
      {/* Enfocable: con teclado también se puede desplazar la vista previa cuando el ticket es largo */}
      <div id="print-preview" className="preview-scroll" tabIndex={0} role="region" aria-label="Vista previa del ticket">
        {isEmpty && emptyMessage ? (
          <p className="preview-empty">{emptyMessage}</p>
        ) : (
          <ReceiptPreview blocks={previewBlocks} paperWidth={controls.paperWidth} />
        )}
      </div>
      <div className="print-bar">
        <button
          type="button"
          className="secondary preview-toggle"
          aria-expanded={isPreviewOpen}
          aria-controls="print-preview"
          onClick={() => setIsPreviewOpen((open) => !open)}
        >
          <Icon name="receipt" size={18} />
          <span>{isPreviewOpen ? 'Ocultar' : 'Vista previa'}</span>
        </button>
        <button className="primary" onClick={() => controls.print(blocks)} disabled={!controls.canPrint || isEmpty}>
          <Icon name="printer" size={18} />
          <span>{controls.busyLabel ?? printLabel}</span>
        </button>
        {actions}
        {!controls.isConnected && (
          <button type="button" className="link" onClick={controls.openPrinter}>Conectar impresora</button>
        )}
        {controls.notice && <small className="ok" role="status">{controls.notice}</small>}
      </div>
    </section>
  );
}
