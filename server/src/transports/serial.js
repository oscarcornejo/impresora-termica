// Bluetooth clásico (SPP): una vez emparejada, la impresora aparece como un puerto serie.
import { SerialPort } from 'serialport';

const BAUD_RATE = 9600; // Ignorado por el enlace Bluetooth, pero requerido por la API.
// Puertos del sistema que nunca son impresoras.
const IGNORED_PORTS = /debug-console|wlan-debug|Bluetooth-Incoming-Port/i;

/** @returns {Promise<Array<{ id: string, name: string, transport: 'serial' }>>} */
export async function listSerialDevices() {
  const ports = await SerialPort.list();
  return ports
    .filter((p) => !IGNORED_PORTS.test(p.path))
    // En macOS se usa /dev/cu.* (no bloquea esperando DCD); se omite el /dev/tty.* gemelo.
    .filter((p) => !(process.platform === 'darwin' && p.path.startsWith('/dev/tty.')))
    .map((p) => ({
      id: p.path,
      name: p.friendlyName ?? p.path.replace(/^\/dev\/(cu|tty)\./, ''),
      transport: 'serial',
    }));
}

/** @param {string} path */
export function connectSerial(path) {
  return new Promise((resolve, reject) => {
    const port = new SerialPort({ path, baudRate: BAUD_RATE, autoOpen: false });
    port.open((err) => {
      if (err) return reject(new Error(`No se pudo abrir ${path}: ${err.message}`));
      resolve(createSerialConnection(port));
    });
  });
}

function createSerialConnection(port) {
  return {
    transport: 'serial',
    id: port.path,
    isOpen: () => port.isOpen,
    /** @param {Buffer} data */
    write: (data) =>
      new Promise((resolve, reject) => {
        port.write(data, (err) => {
          // El detalle técnico va en `cause` (queda en el log del servidor); al equipo le sirve qué revisar.
          if (err) return reject(new Error('No se pudo enviar a la impresora. Revisa que esté encendida y cerca, y vuelve a intentar.', { cause: err }));
          port.drain((drainErr) => (drainErr ? reject(drainErr) : resolve()));
        });
      }),
    close: () =>
      new Promise((resolve) => {
        if (!port.isOpen) return resolve();
        port.close(() => resolve());
      }),
  };
}
