import { BleState } from './blePrinter';

/** Qué decirle a quien vende cuando el Bluetooth del teléfono no está disponible. `null`: está listo. */
export function bluetoothMessage(state: BleState | null): { text: string; canOpenSettings: boolean } | null {
  switch (state) {
    case BleState.On:
    case null:
      return null;
    case BleState.Off:
    case BleState.TurningOff:
      return { text: 'El Bluetooth está apagado. Actívalo desde el Centro de control o en Ajustes del iPhone.', canOpenSettings: false };
    case BleState.Unauthorized:
      return { text: 'La app no tiene permiso para usar Bluetooth. Actívalo en Ajustes › Impresora › Bluetooth.', canOpenSettings: true };
    case BleState.Unsupported:
      return { text: 'Este dispositivo no tiene Bluetooth compatible con impresoras.', canOpenSettings: false };
    default:
      return { text: 'Preparando el Bluetooth…', canOpenSettings: false };
  }
}
