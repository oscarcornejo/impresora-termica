import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatPrice } from '@core/money';
import type { Product } from '@core/types';
import { colors, radius, space, text } from '../../ui/theme';

interface ProductTileProps {
  product: Product;
  /** Unidades ya en la venta (0 si no está). */
  quantity: number;
  onAdd: (product: Product) => void;
}

export const ProductTile = memo(function Tile({ product, quantity, onAdd }: ProductTileProps) {
  const isInCart = quantity > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatPrice(product.price)}${isInCart ? `, ${quantity} en la venta` : ''}`}
      accessibilityHint="Agrega uno a la venta"
      onPress={() => onAdd(product)}
      style={({ pressed }) => [styles.tile, isInCart && styles.inCart, pressed && styles.pressed]}
    >
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      <View style={styles.foot}>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        {isInCart && <Text style={styles.qty}>×{quantity}</Text>}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 92,
    backgroundColor: colors.tile,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(3),
    justifyContent: 'space-between',
    gap: space(2),
  },
  inCart: { borderColor: colors.accent, borderWidth: 2, padding: space(3) - 1 },
  pressed: { backgroundColor: colors.surface2, transform: [{ scale: 0.98 }] },
  name: { fontSize: text.body, fontWeight: '600', color: colors.ink, lineHeight: 20 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: text.meta, color: colors.inkSoft, fontVariant: ['tabular-nums'] },
  qty: {
    fontSize: text.meta,
    fontWeight: '700',
    color: colors.accentInk,
    backgroundColor: colors.accent,
    borderRadius: radius.s,
    overflow: 'hidden',
    paddingHorizontal: space(2),
    paddingVertical: 1,
  },
});
