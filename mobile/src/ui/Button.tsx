import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, MIN_TOUCH, radius, space, text } from './theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'link';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  isDisabled?: boolean;
  isBusy?: boolean;
  /** Para lectores de pantalla, cuando el texto visible no basta. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'secondary', isDisabled = false, isBusy = false, accessibilityLabel, style }: ButtonProps) {
  const isInactive = isDisabled || isBusy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isInactive, busy: isBusy }}
      disabled={isInactive}
      onPress={onPress}
      hitSlop={variant === 'link' ? 8 : 0}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && pressedStyles[variant],
        isInactive && variant !== 'link' && styles.disabled,
        style,
      ]}
    >
      {isBusy && <ActivityIndicator color={variant === 'primary' ? colors.accentInk : colors.ink} />}
      <Text style={[styles.label, labelStyles[variant], isInactive && variant !== 'link' && styles.disabledLabel]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: space(4),
    borderRadius: radius.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(2),
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.tile, borderWidth: 1, borderColor: colors.lineStrong },
  danger: { backgroundColor: colors.tile, borderWidth: 1, borderColor: colors.accent },
  link: { paddingHorizontal: 0, minHeight: 0 },
  disabled: { backgroundColor: colors.disabledBg, borderColor: colors.disabledBg },
  label: { fontSize: text.body, fontWeight: '600' },
  disabledLabel: { color: colors.disabledInk },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accentPressed },
  secondary: { backgroundColor: colors.surface2 },
  danger: { backgroundColor: colors.warnBg },
  link: { opacity: 0.6 },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.accentInk },
  secondary: { color: colors.ink },
  danger: { color: colors.accent },
  link: { color: colors.accent, textDecorationLine: 'underline' },
});
