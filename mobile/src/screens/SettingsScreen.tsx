import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Business } from '@core/types';
import type { PrinterState } from '../printer/usePrinter';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';
import { Section } from '../ui/Section';
import { colors, space, text } from '../ui/theme';
import { BusinessForm } from './settings/BusinessForm';
import { PaperSettings, type PaperOptions } from './settings/PaperSettings';

interface SettingsScreenProps {
  printer: PrinterState;
  onOpenPrinter: () => void;
  paper: PaperOptions;
  onPaperChange: (paper: PaperOptions) => void;
  business: Business | null;
  businessError: string | null;
  onBusinessSave: (business: Business) => Promise<unknown>;
  email: string;
  onSignOut: () => Promise<void>;
}

export function SettingsScreen(props: SettingsScreenProps) {
  const { printer, onOpenPrinter, paper, onPaperChange, business, businessError, onBusinessSave, email, onSignOut } = props;
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Section title="Impresora">
        <View style={styles.status}>
          <View style={[styles.dot, printer.isConnected && styles.dotOn]} />
          <Text style={styles.statusText}>
            {printer.isConnected ? `Conectada: ${printer.name}` : printer.busy ?? 'Sin impresora conectada'}
          </Text>
        </View>
        {printer.error && !printer.isConnected && <Notice>{printer.error}</Notice>}
        <Button
          label={printer.isConnected ? 'Cambiar de impresora' : 'Elegir impresora'}
          variant={printer.isConnected ? 'secondary' : 'primary'}
          onPress={onOpenPrinter}
          isDisabled={printer.busy !== null}
        />
        {printer.isConnected && <Button label="Desconectar" variant="link" onPress={printer.disconnect} />}
      </Section>

      <Section title="Papel">
        <PaperSettings options={paper} isCatPrinter={printer.protocol === 'cat'} onChange={onPaperChange} />
      </Section>

      <Section title="Datos del comprobante">
        {business ? (
          <BusinessForm business={business} onSave={onBusinessSave} />
        ) : (
          <Notice>{businessError ?? 'Cargando datos del negocio…'}</Notice>
        )}
      </Section>

      <Section title="Cuenta">
        <Text style={styles.email}>{email}</Text>
        <Button label="Cerrar sesión" onPress={onSignOut} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space(4), gap: space(6), paddingBottom: space(12) },
  status: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.lineStrong },
  dotOn: { backgroundColor: colors.ok },
  statusText: { flex: 1, fontSize: text.body, color: colors.ink, fontWeight: '500' },
  email: { fontSize: text.body, color: colors.inkSoft },
});
