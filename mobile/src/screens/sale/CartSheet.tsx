import { Pressable, StyleSheet, Text, View } from 'react-native';
import { changeQuantity, lineTotal, removeLine } from '@core/cart';
import { formatPrice } from '@core/money';
import type { SaleSession } from '@core/saleSession';
import type { Block, PaperWidth } from '@core/types';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { colors, MIN_TOUCH, radius, space, text } from '../../ui/theme';
import { ReceiptText } from './ReceiptText';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleSession;
  onNewSale: () => void;
  receipt: Block[];
  paperWidth: PaperWidth;
}

/** La venta en curso: cantidades, quitar productos y cómo saldrá el comprobante. */
export function CartSheet({ isOpen, onClose, sale, onNewSale, receipt, paperWidth }: CartSheetProps) {
  const update = sale.updateCart;
  return (
    <Sheet
      title="Venta"
      isOpen={isOpen}
      onClose={onClose}
      footer={!sale.isDone && sale.cart.length > 0 ? <Button label="Nueva venta (vaciar)" onPress={onNewSale} /> : undefined}
    >
      {sale.cart.length === 0 ? (
        <Text style={styles.hint}>Toca un producto para agregarlo.</Text>
      ) : (
        <View style={styles.lines}>
          {sale.cart.map((line) => (
            <View key={line.productId} style={styles.line}>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{line.name}</Text>
                <Text style={styles.amount}>{formatPrice(lineTotal(line))}</Text>
              </View>
              <View style={styles.qty} accessibilityLabel={`Cantidad de ${line.name}: ${line.quantity}`}>
                <StepButton label="−" a11y={`Uno menos de ${line.name}`} onPress={() => update((prev) => changeQuantity(prev, line.productId, -1))} />
                <Text style={styles.qtyValue}>{line.quantity}</Text>
                <StepButton label="+" a11y={`Uno más de ${line.name}`} onPress={() => update((prev) => changeQuantity(prev, line.productId, 1))} />
              </View>
              <StepButton label="×" a11y={`Quitar ${line.name} de la venta`} isDanger onPress={() => update((prev) => removeLine(prev, line.productId))} />
            </View>
          ))}
        </View>
      )}
      {receipt.length > 0 && <ReceiptText blocks={receipt} paperWidth={paperWidth} />}
    </Sheet>
  );
}

function StepButton({ label, a11y, onPress, isDanger = false }: { label: string; a11y: string; onPress: () => void; isDanger?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={({ pressed }) => [styles.step, pressed && styles.stepPressed]}
    >
      <Text style={[styles.stepLabel, isDanger && styles.danger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: text.body, color: colors.inkSoft },
  lines: { backgroundColor: colors.surface, borderRadius: radius.l, paddingHorizontal: space(3) },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    paddingVertical: space(2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: text.body, fontWeight: '600', color: colors.ink },
  amount: { fontSize: text.meta, color: colors.inkSoft, fontVariant: ['tabular-nums'] },
  qty: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: radius.m },
  qtyValue: { minWidth: 28, textAlign: 'center', fontSize: text.body, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  step: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: radius.m },
  stepPressed: { backgroundColor: colors.line },
  stepLabel: { fontSize: 22, color: colors.ink },
  danger: { color: colors.accent },
});
