import type { PrinterProtocol, PrinterStatus } from '../lib/types';
import { BLUEFY_APP_URL, currentBluetoothSupport } from '../lib/bluetoothSupport';
import { CopyLinkButton } from './CopyLinkButton';

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

      <BluetoothAccess status={status} isBusy={isBusy} onConnect={onConnect} />
    </section>
  );
}

function BluetoothAccess({ status, isBusy, onConnect }: Pick<ConnectionPanelProps, 'status' | 'isBusy' | 'onConnect'>) {
  const support = currentBluetoothSupport();
  if (support === 'ios') {
    return (
      <div className="ios-help">
        <p>
          En iPhone y iPad, Safari no puede usar Bluetooth. Abre esta página en <strong>Bluefy</strong>, un navegador
          gratuito que sí puede: instálalo, pega la dirección y entra con la cuenta del negocio.
        </p>
        <div className="row">
          <a className="button-link" href={BLUEFY_APP_URL} target="_blank" rel="noopener noreferrer">Instalar Bluefy</a>
          <CopyLinkButton />
        </div>
      </div>
    );
  }
  if (support === 'unsupported') {
    return (
      <p className="warning">
        Este navegador no puede conectarse a impresoras Bluetooth. Abre la app en Chrome o Edge (Android o computador),
        o en Bluefy si usas iPhone.
      </p>
    );
  }
  return (
    <>
      <p className="hint">
        Impresoras Bluetooth (BLE), incluidas las “cat printers” como YT01, GB01 o MX05. Enciéndela, acércala
        y elígela en la lista que abre el navegador.
      </p>
      <button onClick={onConnect} disabled={isBusy}>
        {status.connected ? 'Cambiar de impresora' : 'Elegir impresora Bluetooth'}
      </button>
    </>
  );
}
