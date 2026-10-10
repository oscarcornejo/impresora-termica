import { bluetoothMessage } from '../src/printer/bluetoothMessage';
import { BleState } from '../src/printer/blePrinter';

jest.mock('react-native-ble-manager', () => ({
  __esModule: true,
  default: {},
  BleState: {
    Unknown: 'unknown',
    Resetting: 'resetting',
    Unsupported: 'unsupported',
    Unauthorized: 'unauthorized',
    On: 'on',
    Off: 'off',
    TurningOn: 'turning_on',
    TurningOff: 'turning_off',
  },
}));

describe('aviso cuando el Bluetooth del teléfono no está listo', () => {
  test('encendido (o aún sin saber): no hay aviso', () => {
    expect(bluetoothMessage(BleState.On)).toBeNull();
    expect(bluetoothMessage(null)).toBeNull();
  });

  test('apagado: dice dónde encenderlo', () => {
    expect(bluetoothMessage(BleState.Off)?.text).toMatch(/Centro de control/);
  });

  test('sin permiso: ofrece abrir Ajustes', () => {
    expect(bluetoothMessage(BleState.Unauthorized)).toEqual({ text: expect.stringMatching(/permiso/), canOpenSettings: true });
  });
});
