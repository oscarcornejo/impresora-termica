import type { PrinterProtocol, PrinterStatus } from '../lib/types';
import { isWebBluetoothAvailable } from '../lib/webBluetooth';

interface ConnectionPanelProps {
  status: PrinterStatus;
  connectedName: string | null;
  protocol: PrinterProtocol;
  isBusy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const PROTOCOL_LABEL: Record<PrinterProtocol, string> = { escpos: 'ESC/POS', cat: 'Cat printer · imprime como imagen' };

export function ConnectionPanel({ status, connectedName, protocol, isBusy, onConnect, onDisconnect }: ConnectionPanelProps) {
  return (
    <section className="panel">
      <h3>Impresora</h3>

      <div className={`status ${status.connected ? 'is-on' : ''}`}>
        <span className="dot" aria-hidden />
        {status.connected ? (
          <>
            <span className="status-text">
              Conectada a <strong>{connectedName ?? status.id}</strong>
              <small>{PROTOCOL_LABEL[protocol]}</small>
            </span>
            <button className="link" onClick={onDisconnect} disabled={isBusy}>
              Desconectar
            </button>
          </>
        ) : (
          <span>Sin conectar</span>
        )}
      </div>

      {isWebBluetoothAvailable() ? (
        <>
          <p className="hint">
            Impresoras Bluetooth (BLE), incluidas las “cat printers” como YT01, GB01 o MX05. Enciéndela, acércala
            y elígela en la lista que abre el navegador.
          </p>
          <button onClick={onConnect} disabled={isBusy}>
            {status.connected ? 'Cambiar de impresora' : 'Elegir impresora Bluetooth'}
          </button>
        </>
      ) : (
        <p className="warning">
          Este navegador no puede conectarse a impresoras Bluetooth. Abre la app en Chrome o Edge (en Android o en
          computador); en iPhone no funciona.
        </p>
      )}
    </section>
  );
}
