import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';
import { Sheet } from '../ui/Sheet';
import { colors, MIN_TOUCH, radius, space, text } from '../ui/theme';
import { bluetoothMessage } from './bluetoothMessage';
import type { PrinterState } from './usePrinter';
import { usePrinterScan } from './usePrinterScan';

interface PrinterPickerProps {
  isOpen: boolean;
  onClose: () => void;
  printer: PrinterState;
}

/** Hoja para elegir la impresora entre los dispositivos Bluetooth cercanos. */
export function PrinterPicker({ isOpen, onClose, printer }: PrinterPickerProps) {
  const blocked = bluetoothMessage(printer.bluetooth);
  const { candidates, isScanning, rescan } = usePrinterScan(isOpen && !blocked);

  async function choose(id: string, name: string) {
    if (await printer.connect({ id, name })) onClose();
  }

  return (
    <Sheet title="Elegir impresora" isOpen={isOpen} onClose={onClose}>
      {blocked ? (
        <View style={styles.stack}>
          <Notice>{blocked.text}</Notice>
          {blocked.canOpenSettings && <Button label="Abrir Ajustes" onPress={() => Linking.openSettings()} />}
        </View>
      ) : (
        <View style={styles.stack}>
          <Text style={styles.hint}>Enciende la impresora y déjala cerca del teléfono. Toca su nombre para conectarla.</Text>
          {printer.error && <Notice>{printer.error}</Notice>}
          <View accessibilityRole="list" style={styles.list}>
            {candidates.map((device) => (
              <Pressable
                key={device.id}
                accessibilityRole="button"
                accessibilityLabel={`Conectar ${device.name}${device.isLikelyPrinter ? ', impresora' : ''}`}
                disabled={printer.busy !== null}
                onPress={() => choose(device.id, device.name)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <Text style={[styles.name, !device.isLikelyPrinter && styles.otherName]} numberOfLines={1}>{device.name}</Text>
                {device.isLikelyPrinter && <Text style={styles.badge}>Impresora</Text>}
              </Pressable>
            ))}
          </View>
          {printer.busy && (
            <View style={styles.status}>
              <ActivityIndicator color={colors.ink} />
              <Text style={styles.hint}>{printer.busy}</Text>
            </View>
          )}
          {isScanning && !printer.busy && (
            <View style={styles.status}>
              <ActivityIndicator color={colors.inkSoft} />
              <Text style={styles.hint}>Buscando…</Text>
            </View>
          )}
          {!isScanning && candidates.length === 0 && (
            <Notice kind="info">No apareció ningún dispositivo. Revisa que la impresora esté encendida y vuelve a buscar.</Notice>
          )}
          {!isScanning && <Button label="Buscar de nuevo" onPress={rescan} isDisabled={printer.busy !== null} />}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space(4) },
  hint: { fontSize: text.meta, color: colors.inkSoft, lineHeight: 20 },
  list: { backgroundColor: colors.surface, borderRadius: radius.l, overflow: 'hidden' },
  row: {
    minHeight: MIN_TOUCH + 12,
    paddingHorizontal: space(4),
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowPressed: { backgroundColor: colors.surface2 },
  name: { flex: 1, fontSize: text.body, fontWeight: '600', color: colors.ink },
  otherName: { fontWeight: '400', color: colors.inkSoft },
  badge: { fontSize: text.label, fontWeight: '600', color: colors.ok },
  status: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
});
