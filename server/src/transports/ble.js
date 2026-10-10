// Bluetooth Low Energy: la mayoría de impresoras térmicas chinas exponen una
// característica GATT escribible que acepta ESC/POS directamente.

const SCAN_TIMEOUT_MS = 6000;
const CONNECT_TIMEOUT_MS = 10000;
const CHUNK_SIZE = 100; // Bytes por escritura; seguro para MTU pequeñas.
const CHUNK_DELAY_MS = 20; // Pausa para no desbordar el buffer de la impresora.

// Características de escritura conocidas en impresoras térmicas (formato de uuid de noble).
const KNOWN_WRITE_CHARACTERISTICS = [
  '2af1', // servicio 18f0 (genéricas 58 mm)
  'bef8d6c99c214c9eb632bd58c1009f9f', // servicio e7810a71...
  '49535343884143f4a8d4ecbe34729bb3', // ISSC transparent UART
  'ff02', // servicio ff00
  'ffe1', // servicio ffe0 (HM-10)
];

let noblePromise = null;

// noble es opcional (dependencia nativa); se carga solo si se usa BLE.
async function getNoble() {
  noblePromise ??= import('@abandonware/noble').then((m) => m.default ?? m);
  try {
    return await noblePromise;
  } catch (err) {
    noblePromise = null;
    throw new Error(`BLE no disponible (instala @abandonware/noble): ${err.message}`);
  }
}

async function waitPoweredOn(noble) {
  if (noble.state === 'poweredOn') return;
  let onState;
  try {
    await withTimeout(
      new Promise((resolve, reject) => {
        onState = (state) => {
          if (state === 'poweredOn') resolve();
          if (state === 'unauthorized' || state === 'unsupported') {
            reject(new Error(`Bluetooth ${state}: revisa los permisos de Bluetooth de la terminal`));
          }
        };
        noble.on('stateChange', onState);
      }),
      CONNECT_TIMEOUT_MS,
      'El Bluetooth no se encendió a tiempo',
    );
  } finally {
    noble.removeListener('stateChange', onState);
  }
}

// Periféricos vistos en el último escaneo, para poder conectar por id.
const discovered = new Map();

/** @returns {Promise<Array<{ id: string, name: string, transport: 'ble', rssi: number }>>} */
export async function scanBleDevices(timeoutMs = SCAN_TIMEOUT_MS) {
  const noble = await getNoble();
  await waitPoweredOn(noble);

  const found = new Map();
  const onDiscover = (peripheral) => {
    const name = peripheral.advertisement?.localName;
    if (!name) return; // Las impresoras siempre anuncian un nombre.
    discovered.set(peripheral.id, peripheral);
    found.set(peripheral.id, { id: peripheral.id, name, transport: 'ble', rssi: peripheral.rssi });
  };

  noble.on('discover', onDiscover);
  try {
    await noble.startScanningAsync([], false);
    await delay(timeoutMs);
  } finally {
    await noble.stopScanningAsync().catch(() => {});
    noble.removeListener('discover', onDiscover);
  }
  return [...found.values()].sort((a, b) => b.rssi - a.rssi);
}

/** @param {string} id */
export async function connectBle(id) {
  const peripheral = discovered.get(id);
  if (!peripheral) throw new Error('Dispositivo BLE no encontrado; vuelve a escanear');

  await withTimeout(peripheral.connectAsync(), CONNECT_TIMEOUT_MS, 'Tiempo de conexión agotado');
  const { characteristics } = await peripheral.discoverAllServicesAndCharacteristicsAsync();
  const characteristic = pickWriteCharacteristic(characteristics);
  if (!characteristic) {
    await peripheral.disconnectAsync().catch(() => {});
    throw new Error('El dispositivo no tiene una característica escribible compatible');
  }
  return createBleConnection(peripheral, characteristic);
}

export function pickWriteCharacteristic(characteristics) {
  const writable = characteristics.filter((c) =>
    c.properties.some((p) => p === 'write' || p === 'writeWithoutResponse'),
  );
  return (
    KNOWN_WRITE_CHARACTERISTICS.map((uuid) => writable.find((c) => c.uuid === uuid)).find(Boolean) ??
    writable[0] ??
    null
  );
}

function createBleConnection(peripheral, characteristic) {
  const withoutResponse = characteristic.properties.includes('writeWithoutResponse');
  return {
    transport: 'ble',
    id: peripheral.id,
    isOpen: () => peripheral.state === 'connected',
    /** @param {Buffer} data */
    write: async (data) => {
      for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
        await characteristic.writeAsync(data.subarray(offset, offset + CHUNK_SIZE), withoutResponse);
        if (withoutResponse) await delay(CHUNK_DELAY_MS);
      }
    },
    close: () => peripheral.disconnectAsync().catch(() => {}),
  };
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
