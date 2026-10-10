import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { withTearLine } from '@core/blocks';
import { addProduct, cartCount, cartTotal, quantityOf } from '@core/cart';
import { buildSaleReceipt } from '@core/receipt';
import type { SaleSession } from '@core/saleSession';
import { PAPER_CHARS, type Business, type Product } from '@core/types';
import { useProducts } from '@core/useProducts';
import { useAppData } from '../data/AppDataContext';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';
import { SearchField } from '../ui/SearchField';
import { colors, space, text } from '../ui/theme';
import { CartSheet } from './sale/CartSheet';
import { CheckoutBar } from './sale/CheckoutBar';
import type { PrintControls } from './sale/printControls';
import { ProductTile } from './sale/ProductTile';

interface SaleScreenProps {
  business: Business | null;
  sale: SaleSession;
  onNewSale: () => void;
  controls: PrintControls;
  onGoToProducts: () => void;
}

export function SaleScreen({ business, sale, onNewSale, controls, onGoToProducts }: SaleScreenProps) {
  const { cart, updateCart } = sale;
  const { products, search, setSearch, isLoading, isOffline, error } = useProducts(useAppData());
  const [isCartOpen, setIsCartOpen] = useState(false);

  const receipt = useMemo(
    () => (business && cart.length > 0 ? buildSaleReceipt({ business, lines: cart, chars: PAPER_CHARS[controls.paperWidth] }) : []),
    [business, cart, controls.paperWidth],
  );
  const add = useCallback((product: Product) => updateCart((prev) => addProduct(prev, product)), [updateCart]);

  async function printSale() {
    // Se guarda el carrito impreso: si cambia mientras imprime, la venta no se da por cerrada.
    const printedCart = cart;
    if (!(await controls.print(receipt))) return;
    sale.markPrinted(printedCart);
    setIsCartOpen(false);
  }

  function startNewSale() {
    onNewSale();
    setIsCartOpen(false);
  }

  // Con un número impar, un hueco al final evita que la última tarjeta ocupe todo el ancho.
  const tiles: Array<Product | null> = products.length % 2 === 1 ? [...products, null] : products;
  const hasNoProducts = !isLoading && products.length === 0 && !search;
  const hasNoResults = !isLoading && products.length === 0 && Boolean(search);

  return (
    <View style={styles.page}>
      <FlatList
        data={tiles}
        extraData={cart}
        keyExtractor={(p) => (p ? String(p.id) : 'filler')}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.head}>
            <SearchField value={search} onChange={setSearch} />
            {error && <Notice>{error}</Notice>}
            {isOffline && <Notice kind="info">Sin conexión: vendes con el catálogo guardado en este teléfono.</Notice>}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading && <Text style={styles.emptyText}>Cargando productos…</Text>}
            {hasNoProducts && (
              <>
                <Text style={styles.emptyText}>Aún no hay productos cargados.</Text>
                <Button label="Cargar productos" onPress={onGoToProducts} />
              </>
            )}
            {hasNoResults && <Text style={styles.emptyText}>Ningún producto coincide con “{search.trim()}”.</Text>}
          </View>
        }
        renderItem={({ item }) =>
          item ? <ProductTile product={item} quantity={quantityOf(cart, item.id)} onAdd={add} /> : <View style={styles.filler} />
        }
      />
      <CheckoutBar
        total={cartTotal(cart)}
        itemCount={cartCount(cart)}
        controls={controls}
        hasReceipt={receipt.length > 0}
        onPrint={printSale}
        isSaleDone={sale.isDone}
        onNewSale={startNewSale}
        canUndo={sale.canUndo}
        onUndo={sale.undo}
        onOpenCart={() => setIsCartOpen(true)}
      />
      <CartSheet
        isOpen={isCartOpen && cart.length > 0}
        onClose={() => setIsCartOpen(false)}
        sale={sale}
        onNewSale={startNewSale}
        receipt={controls.hasTearLine ? withTearLine(receipt) : receipt}
        paperWidth={controls.paperWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space(4), gap: space(3), paddingBottom: space(6) },
  row: { gap: space(3) },
  head: { gap: space(3), marginBottom: space(1) },
  empty: { paddingVertical: space(10), alignItems: 'center', gap: space(4) },
  filler: { flex: 1 },
  emptyText: { fontSize: text.body, color: colors.inkSoft, textAlign: 'center' },
});
