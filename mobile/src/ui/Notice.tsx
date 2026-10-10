import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, text } from './theme';

type Kind = 'warning' | 'info' | 'ok';

/** Aviso en línea. Los de error se anuncian al lector de pantalla apenas aparecen. */
export function Notice({ kind = 'warning', children }: { kind?: Kind; children: string }) {
  return (
    <View
      accessibilityRole={kind === 'warning' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
      style={[styles.box, styles[kind]]}
    >
      <Text style={[styles.text, textStyles[kind]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.m, paddingHorizontal: space(3), paddingVertical: space(2.5) },
  warning: { backgroundColor: colors.warnBg },
  info: { backgroundColor: colors.surface2 },
  ok: { backgroundColor: colors.surface2 },
  text: { fontSize: text.meta, lineHeight: 20 },
});

const textStyles = StyleSheet.create({
  warning: { color: colors.warnInk },
  info: { color: colors.inkSoft },
  ok: { color: colors.ok, fontWeight: '600' },
});
