import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, MIN_TOUCH, space, text } from './theme';

interface TabBarProps<T extends string> {
  tabs: Array<{ value: T; label: string; badge?: number }>;
  value: T;
  onChange: (value: T) => void;
}

/** Barra de secciones abajo, como las apps de iOS. */
export function TabBar<T extends string>({ tabs, value, onChange }: TabBarProps<T>) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View accessibilityRole="tablist" style={[styles.bar, { paddingBottom: Math.max(bottom, space(2)) }]}>
      {tabs.map((tab) => {
        const isSelected = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(tab.value)}
            style={styles.tab}
          >
            <View style={[styles.marker, isSelected && styles.markerOn]} />
            <Text style={[styles.label, isSelected && styles.labelOn]}>
              {tab.label}
              {tab.badge ? ` · ${tab.badge}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  tab: { flex: 1, minHeight: MIN_TOUCH + 6, alignItems: 'center', justifyContent: 'center', gap: space(1) },
  marker: { width: 22, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  markerOn: { backgroundColor: colors.accent },
  label: { fontSize: text.meta, color: colors.inkSoft, fontWeight: '500' },
  labelOn: { color: colors.ink, fontWeight: '700' },
});
