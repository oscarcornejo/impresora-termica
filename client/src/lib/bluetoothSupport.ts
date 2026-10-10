// Qué puede hacer este dispositivo con Bluetooth, y escritura compatible con navegadores de iPhone.

/** Navegador de iPhone/iPad con Web Bluetooth (en Safari y en el resto de navegadores de iOS no existe). */
export const BLUEFY_APP_URL = 'https://apps.apple.com/app/id1492822055';

export type BluetoothSupport = 'available' | 'ios' | 'unsupported';

interface Environment {
  hasBluetooth: boolean;
  userAgent: string;
  maxTouchPoints: number;
}

// iPadOS se presenta como Mac; se distingue por la pantalla táctil.
const isIOS = ({ userAgent, maxTouchPoints }: Environment) =>
  /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);

export function bluetoothSupport(env: Environment): BluetoothSupport {
  if (env.hasBluetooth) return 'available';
  return isIOS(env) ? 'ios' : 'unsupported';
}

export const currentBluetoothSupport = (): BluetoothSupport =>
  typeof navigator === 'undefined'
    ? 'unsupported'
    : bluetoothSupport({ hasBluetooth: 'bluetooth' in navigator, userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints ?? 0 });

/** Lo mínimo de una característica GATT para escribir; los métodos nuevos pueden faltar. */
export interface WritableCharacteristic {
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
  writeValueWithResponse?: (value: BufferSource) => Promise<void>;
  writeValue?: (value: BufferSource) => Promise<void>;
}

export async function writeChunk(characteristic: WritableCharacteristic, chunk: Uint8Array<ArrayBuffer>, withoutResponse: boolean): Promise<void> {
  if (withoutResponse && typeof characteristic.writeValueWithoutResponse === 'function') {
    return characteristic.writeValueWithoutResponse(chunk);
  }
  if (typeof characteristic.writeValueWithResponse === 'function') return characteristic.writeValueWithResponse(chunk);
  if (typeof characteristic.writeValue === 'function') return characteristic.writeValue(chunk);
  throw new Error('Este navegador no puede enviar datos a la impresora. En iPhone usa Bluefy; en Android o computador, Chrome.');
}
