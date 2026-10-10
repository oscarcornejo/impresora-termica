import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TOUCH, radius, space, text } from './theme';

interface PrinterChipProps {
  isConnected: boolean;
  name: string | null;
  busy: string | null;
  onPress: () => void;
}

/** Estado de la impresora siempre a la vista; tocarlo abre la selección. */
export function PrinterChip({ isConnected, name, busy, onPress }: PrinterChipProps) {
  const label = busy ? 'Conectando…' : isConnected ? name ?? 'Impresora' : 'Sin impresora';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isConnected ? `Impresora ${name} conectada. Cambiar` : 'Sin impresora. Conectar'}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.chip, !isConnected && styles.off, pressed && styles.pressed]}
    >
      <View style={[styles.dot, isConnected && styles.dotOn]} />
      <Text style={[styles.text, !isConnected && styles.textOff]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH - 8,
    maxWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    paddingHorizontal: space(3),
    borderRadius: radius.l * 2,
    backgroundColor: colors.tile,
    borderWidth: 1,
    borderColor: colors.line,
  },
  off: { borderColor: colors.accent },
  pressed: { backgroundColor: colors.surface2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  dotOn: { backgroundColor: colors.ok },
  text: { fontSize: text.meta, fontWeight: '600', color: colors.ink, flexShrink: 1 },
  textOff: { color: colors.accent },
});
