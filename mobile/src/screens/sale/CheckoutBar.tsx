import { StyleSheet, Text, View } from 'react-native';
import { formatPrice } from '@core/money';
import { Button } from '../../ui/Button';
import { colors, space, text } from '../../ui/theme';
import type { PrintControls } from './printControls';

interface CheckoutBarProps {
  total: number;
  itemCount: number;
  controls: PrintControls;
  /** Hay un comprobante listo (falla si no cargaron los datos del negocio). */
  hasReceipt: boolean;
  onPrint: () => void;
  isSaleDone: boolean;
  onNewSale: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onOpenCart: () => void;
}

const unitsLabel = (count: number) => (count === 1 ? '1 producto' : `${count} productos`);

/** Barra de cobro fija abajo: el total siempre visible y la acción principal al alcance del pulgar. */
export function CheckoutBar(props: CheckoutBarProps) {
  const { total, itemCount, controls, isSaleDone, onOpenCart } = props;
  const label = itemCount === 0 ? 'Total' : `${isSaleDone ? 'Impreso' : 'Total'} · ${unitsLabel(itemCount)}`;
  const action = primaryAction(props);

  return (
    <View style={[styles.bar, isSaleDone && styles.done]} accessibilityLabel="Cobro">
      <View style={styles.top}>
        <View style={styles.total}>
          <Text style={[styles.label, isSaleDone && styles.doneLabel]}>{label}</Text>
          <Text style={styles.amount} accessibilityLiveRegion="polite">{formatPrice(total)}</Text>
        </View>
        {isSaleDone ? (
          <Button
            label={controls.busyLabel ?? 'Reimprimir'}
            onPress={controls.isConnected ? props.onPrint : controls.openPrinter}
            isDisabled={controls.busyLabel !== null}
          />
        ) : (
          <Button label="Ver venta" onPress={onOpenCart} isDisabled={itemCount === 0} />
        )}
      </View>
      <Button label={action.label} variant="primary" onPress={action.onPress} isDisabled={action.isDisabled} isBusy={action.isBusy} />
      <StatusRow {...props} />
    </View>
  );
}

function primaryAction({ itemCount, controls, hasReceipt, onPrint, isSaleDone, onNewSale }: CheckoutBarProps) {
  if (isSaleDone) return { label: 'Nueva venta', onPress: onNewSale, isDisabled: false, isBusy: false };
  if (!controls.isConnected) {
    return { label: controls.busyLabel ?? 'Conectar impresora', onPress: controls.openPrinter, isDisabled: false, isBusy: controls.busyLabel !== null };
  }
  return {
    label: controls.busyLabel ?? (controls.printError ? 'Reintentar impresión' : 'Imprimir comprobante'),
    onPress: onPrint,
    isDisabled: !controls.canPrint || !hasReceipt || itemCount === 0,
    isBusy: controls.busyLabel !== null,
  };
}

// Una sola línea de estado: deshacer, error de impresión o aviso, en ese orden.
function StatusRow({ canUndo, onUndo, controls, isSaleDone }: CheckoutBarProps) {
  if (canUndo) {
    return (
      <View style={styles.status}>
        <Text style={styles.statusText}>Se vació la venta anterior.</Text>
        <Button label="Deshacer" variant="link" onPress={onUndo} />
      </View>
    );
  }
  const printError = controls.busyLabel === null ? controls.printError : null;
  if (printError) return <Text accessibilityRole="alert" style={[styles.statusText, styles.error]}>No se imprimió. {printError}</Text>;
  if (!isSaleDone && controls.notice) return <Text style={styles.statusText}>{controls.notice}</Text>;
  return null;
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    paddingHorizontal: space(4),
    paddingTop: space(3),
    paddingBottom: space(3),
    gap: space(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -6 },
  },
  done: { backgroundColor: '#eef4ee' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(3) },
  total: { flexShrink: 1 },
  label: { fontSize: text.meta, color: colors.inkSoft },
  doneLabel: { color: colors.ok, fontWeight: '600' },
  amount: { fontSize: text.amount, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  status: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  statusText: { fontSize: text.meta, color: colors.inkSoft, lineHeight: 20 },
  error: { color: colors.warnInk },
});
