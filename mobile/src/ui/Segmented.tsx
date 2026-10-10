import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TOUCH, radius, text } from './theme';

export interface SegmentedOption<T> {
  value: T;
  label: string;
  isDisabled?: boolean;
}

interface SegmentedProps<T> {
  /** Nombre del grupo para el lector de pantalla. */
  label: string;
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.group}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled: option.isDisabled }}
            disabled={option.isDisabled}
            onPress={() => onChange(option.value)}
            style={[styles.option, isSelected && styles.selected]}
          >
            <Text style={[styles.label, isSelected && styles.selectedLabel, option.isDisabled && styles.disabledLabel]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.m, padding: 3, gap: 3 },
  option: { flex: 1, minHeight: MIN_TOUCH - 6, borderRadius: radius.s + 2, alignItems: 'center', justifyContent: 'center' },
  selected: {
    backgroundColor: colors.tile,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  label: { fontSize: text.meta, color: colors.inkSoft, fontWeight: '500' },
  selectedLabel: { color: colors.ink, fontWeight: '600' },
  disabledLabel: { color: colors.placeholder, textDecorationLine: 'line-through' },
});
