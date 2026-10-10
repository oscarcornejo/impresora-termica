import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, space } from './theme';

interface SheetProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Barra fija al pie (acciones). */
  footer?: ReactNode;
}

/** Hoja de iOS que sube desde abajo; se cierra deslizando o con "Listo". */
export function Sheet({ title, isOpen, onClose, children, footer }: SheetProps) {
  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.head}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Button label="Listo" variant="link" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space(5),
    paddingTop: space(5),
    paddingBottom: space(3),
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  body: { padding: space(4), paddingTop: space(1), gap: space(5), paddingBottom: space(10) },
  footer: {
    padding: space(4),
    paddingBottom: space(8),
    gap: space(2),
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
