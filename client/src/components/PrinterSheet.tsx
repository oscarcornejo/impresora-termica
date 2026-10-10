import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface PrinterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Panel de impresora: hoja que sube desde abajo en el celular y panel lateral en pantallas grandes.
 * Usa <dialog> nativo para el foco, Esc y el fondo inerte.
 */
export function PrinterSheet({ isOpen, onClose, children }: PrinterSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (isOpen && !el.open) el.showModal();
    if (!isOpen && el.open) el.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby="printer-sheet-title"
      onClose={onClose}
      // Un toque en el fondo oscuro (fuera del contenido) cierra el panel.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet-body">
        <header className="sheet-head">
          <h2 id="printer-sheet-title">Impresora y papel</h2>
          <button type="button" className="icon sheet-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
