import { Icon } from './Icon';

interface PrinterChipProps {
  isConnected: boolean;
  name: string | null;
  onOpen: () => void;
}

/** Estado de la impresora en la barra superior; abre el panel de conexión y papel. */
export function PrinterChip({ isConnected, name, onOpen }: PrinterChipProps) {
  return (
    <button
      type="button"
      className={`printer-chip ${isConnected ? 'is-on' : 'is-off'}`}
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={isConnected ? `${name ? `Impresora ${name}` : 'Impresora'} conectada. Abrir ajustes de impresora` : 'Sin impresora. Conectar'}
    >
      <Icon name="printer" size={18} />
      <span className="printer-chip-dot" aria-hidden="true" />
      <span className="printer-chip-label">{isConnected ? name ?? 'Conectada' : 'Sin impresora'}</span>
    </button>
  );
}
