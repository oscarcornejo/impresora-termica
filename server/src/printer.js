// Mantiene la conexión activa con la impresora (una sola a la vez).
import { listSerialDevices, connectSerial } from './transports/serial.js';
import { scanBleDevices, connectBle } from './transports/ble.js';

const CONNECTORS = { serial: connectSerial, ble: connectBle };

/** @param {{ connectors?: typeof CONNECTORS }} [deps] */
export function createPrinterManager({ connectors = CONNECTORS } = {}) {
  let connection = null;
  let printing = Promise.resolve();

  const status = () => ({
    connected: Boolean(connection?.isOpen()),
    transport: connection?.transport ?? null,
    id: connection?.id ?? null,
  });

  async function disconnect() {
    const current = connection;
    connection = null;
    if (current) await current.close();
  }

  async function connect(transport, id) {
    await disconnect();
    connection = await connectors[transport](id);
    return status();
  }

  // Los trabajos se encolan para que dos impresiones no se mezclen.
  function print(data) {
    const job = printing.then(async () => {
      if (!connection?.isOpen()) throw new Error('La impresora no está conectada. Conéctala de nuevo y vuelve a intentar.');
      await connection.write(data);
    });
    printing = job.catch(() => {});
    return job;
  }

  return { status, connect, disconnect, print };
}

/** @param {{ ble: boolean }} options */
export async function listDevices({ ble }) {
  const [serial, bleResult] = await Promise.allSettled([
    listSerialDevices(),
    ble ? scanBleDevices() : Promise.resolve([]),
  ]);
  return {
    devices: [...valueOr(serial, []), ...valueOr(bleResult, [])],
    warnings: [serial, bleResult]
      .filter((r) => r.status === 'rejected')
      .map((r) => r.reason.message),
  };
}

const valueOr = (result, fallback) => (result.status === 'fulfilled' ? result.value : fallback);
