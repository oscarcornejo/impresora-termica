import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatPrice } from '@core/money';
import type { Product } from '@core/types';
import { useProducts } from '@core/useProducts';
import { useAppData } from '../data/AppDataContext';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';
import { SearchField } from '../ui/SearchField';
import { colors, MIN_TOUCH, space, text } from '../ui/theme';
import { ProductFormSheet } from './products/ProductFormSheet';

type Editing = { product: Product | null } | null;

export function ProductsScreen() {
  const { products, search, setSearch, isLoading, isOffline, error, save, remove } = useProducts(useAppData());
  const [editing, setEditing] = useState<Editing>(null);

  const emptyMessage = search ? 'Ningún producto coincide con la búsqueda.' : 'Aún no hay productos. Agrega el primero.';

  return (
    <View style={styles.page}>
      <FlatList
        data={products}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.head}>
            <Button label="Agregar producto" variant="primary" onPress={() => setEditing({ product: null })} isDisabled={isOffline} />
            <SearchField value={search} onChange={setSearch} placeholder="Buscar por nombre o código…" />
            {error && <Notice>{error}</Notice>}
            {isOffline && <Notice kind="info">Sin conexión: esta es la copia guardada en el teléfono. Para agregar o editar productos hace falta internet.</Notice>}
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Cargando productos…' : emptyMessage}</Text>}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${formatPrice(item.price)}${item.code ? `, código ${item.code}` : ''}`}
            accessibilityHint="Abre el producto para editarlo"
            disabled={isOffline}
            onPress={() => setEditing({ product: item })}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              {item.code && <Text style={styles.code}>{item.code}</Text>}
            </View>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            {!isOffline && <Text style={styles.chevron}>›</Text>}
          </Pressable>
        )}
      />
      <ProductFormSheet
        isOpen={editing !== null}
        product={editing?.product ?? null}
        onClose={() => setEditing(null)}
        onSave={save}
        onDelete={remove}
      />
    </View>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space(4), paddingBottom: space(10) },
  head: { gap: space(3), marginBottom: space(4) },
  empty: { fontSize: text.body, color: colors.inkSoft, textAlign: 'center', paddingVertical: space(10) },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: space(4) },
  row: {
    minHeight: MIN_TOUCH + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: colors.surface,
    paddingHorizontal: space(4),
    paddingVertical: space(2.5),
  },
  pressed: { backgroundColor: colors.surface2 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: text.body, fontWeight: '600', color: colors.ink },
  code: { fontSize: text.meta, color: colors.inkSoft, fontFamily: 'Menlo' },
  price: { fontSize: text.body, color: colors.ink, fontVariant: ['tabular-nums'] },
  chevron: { fontSize: 22, color: colors.lineStrong },
});
