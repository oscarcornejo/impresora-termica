import { describe, expect, test, vi } from 'vitest';
import { bluetoothSupport, writeChunk } from './bluetoothSupport';

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const MAC_SAFARI_UA = IPAD_AS_MAC_UA;
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';

describe('soporte de Bluetooth según el dispositivo', () => {
  test('con Web Bluetooth disponible, se puede conectar (también Bluefy en iPhone)', () => {
    expect(bluetoothSupport({ hasBluetooth: true, userAgent: IPHONE_UA, maxTouchPoints: 5 })).toBe('available');
    expect(bluetoothSupport({ hasBluetooth: true, userAgent: ANDROID_UA, maxTouchPoints: 5 })).toBe('available');
  });

  test('iPhone sin Web Bluetooth: hay que abrir la página en Bluefy', () => {
    expect(bluetoothSupport({ hasBluetooth: false, userAgent: IPHONE_UA, maxTouchPoints: 5 })).toBe('ios');
  });

  test('iPad que se presenta como Mac (con pantalla táctil) también es iOS', () => {
    expect(bluetoothSupport({ hasBluetooth: false, userAgent: IPAD_AS_MAC_UA, maxTouchPoints: 5 })).toBe('ios');
  });

  test('Safari en Mac (sin pantalla táctil) no es iOS: se recomienda Chrome', () => {
    expect(bluetoothSupport({ hasBluetooth: false, userAgent: MAC_SAFARI_UA, maxTouchPoints: 0 })).toBe('unsupported');
  });
});

describe('escritura en la impresora', () => {
  const chunk = Uint8Array.of(1, 2, 3);

  test('sin respuesta cuando la característica lo permite', async () => {
    const c = { writeValueWithoutResponse: vi.fn(async () => {}), writeValueWithResponse: vi.fn(), writeValue: vi.fn() };
    await writeChunk(c, chunk, true);
    expect(c.writeValueWithoutResponse).toHaveBeenCalledWith(chunk);
    expect(c.writeValueWithResponse).not.toHaveBeenCalled();
  });

  test('con respuesta cuando no se pide sin respuesta', async () => {
    const c = { writeValueWithoutResponse: vi.fn(), writeValueWithResponse: vi.fn(async () => {}), writeValue: vi.fn() };
    await writeChunk(c, chunk, false);
    expect(c.writeValueWithResponse).toHaveBeenCalledWith(chunk);
  });

  test('navegadores que solo traen writeValue (algunos de iPhone)', async () => {
    const c = { writeValue: vi.fn(async () => {}) };
    await writeChunk(c, chunk, true);
    await writeChunk(c, chunk, false);
    expect(c.writeValue).toHaveBeenCalledTimes(2);
  });
});
