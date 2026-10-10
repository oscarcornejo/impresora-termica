import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, text } from './theme';

/** Bloque con rótulo, como los grupos de Ajustes de iOS. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>{title.toUpperCase()}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space(2) },
  title: { fontSize: text.label, fontWeight: '600', color: colors.inkSoft, letterSpacing: 0.6, paddingHorizontal: space(1) },
  body: { backgroundColor: colors.surface, borderRadius: radius.l, padding: space(4), gap: space(3) },
});
