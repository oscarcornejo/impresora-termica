import { StyleSheet, TextInput } from 'react-native';
import { colors, MIN_TOUCH, radius, space, text } from './theme';

export function SearchField({ value, onChange, placeholder = 'Buscar…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <TextInput
      accessibilityLabel="Buscar productos"
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.placeholder}
      selectionColor={colors.accent}
      clearButtonMode="while-editing"
      autoCorrect={false}
      returnKeyType="search"
      style={styles.search}
    />
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: MIN_TOUCH,
    backgroundColor: colors.surface2,
    borderRadius: radius.m,
    paddingHorizontal: space(3),
    fontSize: text.body,
    color: colors.ink,
  },
});
