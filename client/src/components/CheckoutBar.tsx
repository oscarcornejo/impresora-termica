import { Icon } from './Icon';
import type { PrintControls } from './PrintPanel';
import { formatPrice } from '../lib/money';

interface CheckoutBarProps {
  total: number;
  itemCount: number;
  controls: PrintControls;
  /** Hay un comprobante listo para imprimir (falla si no cargaron los datos del negocio). */
  canPrint: boolean;
  onPrint: () => void;
  /** El comprobante de este carrito ya se imprimió. */
  isSaleDone: boolean;
  onNewSale: () => void;
  canUndo: boolean;
  onUndo: () => void;
  /** Cajón de la venta abierto (solo pantallas angostas). */
  isTicketOpen: boolean;
  onToggleTicket: () => void;
}

/** Barra de cobro fija abajo: total siempre visible y la acción principal al alcance del pulgar. */
export function CheckoutBar(props: CheckoutBarProps) {
  const { total, itemCount, controls, isSaleDone, canUndo, onUndo } = props;
  const printError = controls.busyLabel === null ? controls.printError : null;
  const itemLabel = itemCount === 1 ? '1 producto' : `${itemCount} productos`;
  const label = itemCount === 0 ? 'Total' : `${isSaleDone ? 'Impreso' : 'Total'} · ${itemLabel}`;

  return (
    <div id="checkout" tabIndex={-1} className={`checkout-bar ${isSaleDone ? 'is-done' : ''}`} role="region" aria-label="Cobro">
      <div className="checkout-inner">
        <div className="checkout-total">
          <span className="checkout-label">{label}</span>
          <strong className="checkout-amount" aria-live="polite">{formatPrice(total)}</strong>
        </div>
        <SecondaryAction {...props} />
        <PrimaryAction {...props} />
      </div>
      <StatusRow isSaleDone={isSaleDone} canUndo={canUndo} onUndo={onUndo} printError={printError} notice={controls.notice} />
      {/* Siempre en el DOM, para que el lector de pantalla anuncie el cambio al cerrar la venta. */}
      <p className="sr-only" role="status">
        {isSaleDone ? `Comprobante impreso por ${formatPrice(total)}. Puedes empezar una nueva venta.` : ''}
      </p>
    </div>
  );
}

interface StatusRowProps {
  isSaleDone: boolean;
  canUndo: boolean;
  onUndo: () => void;
  printError: string | null;
  notice: string | null;
}

// Una sola línea de estado bajo la barra: deshacer, error de impresión o aviso, en ese orden de prioridad.
function StatusRow({ isSaleDone, canUndo, onUndo, printError, notice }: StatusRowProps) {
  if (canUndo) {
    return (
      <p className="checkout-undo" role="status">
        <span>Se vació la venta anterior.</span>
        <button type="button" className="link" onClick={onUndo}>Deshacer</button>
      </p>
    );
  }
  if (printError) return <p className="checkout-error" role="alert">No se imprimió. {printError}</p>;
  if (!isSaleDone && notice) return <p className="checkout-notice" role="status">{notice}</p>;
  return null;
}

// Venta impresa: "Reimprimir" toma el lugar de "Ver venta".
function SecondaryAction({ itemCount, controls, onPrint, isSaleDone, isTicketOpen, onToggleTicket }: CheckoutBarProps) {
  if (isSaleDone) {
    return (
      <button
        type="button"
        className="secondary receipt-toggle"
        onClick={controls.isConnected ? onPrint : controls.openPrinter}
        disabled={controls.busyLabel !== null}
      >
        <Icon name="printer" size={18} />
        <span>{controls.busyLabel ?? 'Reimprimir'}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="secondary receipt-toggle ticket-toggle"
      onClick={onToggleTicket}
      aria-expanded={isTicketOpen}
      aria-controls="sale-ticket"
      disabled={itemCount === 0}
    >
      <Icon name="receipt" size={18} />
      <span>{isTicketOpen ? 'Ocultar venta' : 'Ver venta'}</span>
    </button>
  );
}

interface ActionSpec {
  icon: 'plus' | 'printer';
  text: string;
  onClick: () => void;
  disabled: boolean;
}

function primaryAction({ itemCount, controls, canPrint, onPrint, isSaleDone, onNewSale }: CheckoutBarProps): ActionSpec {
  if (isSaleDone) return { icon: 'plus', text: 'Nueva venta', onClick: onNewSale, disabled: false };
  if (!controls.isConnected) {
    return { icon: 'printer', text: 'Conectar impresora', onClick: controls.openPrinter, disabled: false };
  }
  return {
    icon: 'printer',
    text: controls.busyLabel ?? (controls.printError ? 'Reintentar impresión' : 'Imprimir comprobante'),
    onClick: onPrint,
    disabled: !controls.canPrint || !canPrint || itemCount === 0,
  };
}

// Un solo botón que cambia de papel, para que el foco no se pierda entre estados.
function PrimaryAction(props: CheckoutBarProps) {
  const action = primaryAction(props);
  return (
    <button type="button" className="primary checkout-action" onClick={action.onClick} disabled={action.disabled}>
      <Icon name={action.icon} />
      <span>{action.text}</span>
    </button>
  );
}
