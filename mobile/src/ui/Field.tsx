import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, MIN_TOUCH, radius, space, text } from './theme';

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Texto fijo antes del valor, como "$" en los precios. */
  prefix?: string;
}

export function Field({ label, prefix, multiline, ...input }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.box}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.accent}
          multiline={multiline}
          style={[styles.input, multiline && styles.multiline]}
          {...input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space(1.5) },
  label: { fontSize: text.meta, color: colors.inkSoft, fontWeight: '500' },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tile,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.m,
    paddingHorizontal: space(3),
  },
  prefix: { fontSize: text.body, color: colors.inkSoft, marginRight: space(1) },
  input: { flex: 1, minHeight: MIN_TOUCH, fontSize: text.body, color: colors.ink, paddingVertical: space(2.5) },
  multiline: { minHeight: MIN_TOUCH * 1.6, textAlignVertical: 'top' },
});
