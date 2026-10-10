import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { parsePrice } from '@core/money';
import type { Product, ProductInput } from '@core/types';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Notice } from '../../ui/Notice';
import { Sheet } from '../../ui/Sheet';
import { space } from '../../ui/theme';

interface ProductFormSheetProps {
  isOpen: boolean;
  /** Producto en edición; `null` para crear uno nuevo. */
  product: Product | null;
  onClose: () => void;
  onSave: (input: ProductInput, id?: number) => Promise<unknown>;
  onDelete: (id: number) => Promise<void>;
}

const toFields = (product: Product | null) => ({
  name: product?.name ?? '',
  price: product ? String(product.price) : '',
  code: product?.code ?? '',
});

const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export function ProductFormSheet({ isOpen, product, onClose, onSave, onDelete }: ProductFormSheetProps) {
  const [fields, setFields] = useState(() => toFields(product));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = product !== null;

  // Cada vez que se abre, el formulario parte del producto elegido (o vacío).
  useEffect(() => {
    if (!isOpen) return;
    setFields(toFields(product));
    setError(null);
  }, [isOpen, product]);

  const set = (field: keyof typeof fields) => (value: string) => setFields((prev) => ({ ...prev, [field]: value }));

  async function submit() {
    const name = fields.name.trim();
    const price = parsePrice(fields.price);
    if (!name) return setError('Escribe el nombre del producto');
    if (price === null) return setError('El precio debe ser un número entero, por ejemplo 2500');
    setIsSaving(true);
    setError(null);
    try {
      await onSave({ name, price, code: fields.code.trim() || null }, product?.id);
      onClose();
    } catch (err) {
      setError(errorText(err, 'No se pudo guardar'));
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete() {
    if (!product) return;
    Alert.alert(`¿Eliminar ${product.name}?`, 'Deja de aparecer en el catálogo de todos los dispositivos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          onDelete(product.id)
            .then(onClose)
            .catch((err) => setError(errorText(err, 'No se pudo eliminar'))),
      },
    ]);
  }

  return (
    <Sheet
      title={isEditing ? 'Editar producto' : 'Nuevo producto'}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <Button
            label={isSaving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Agregar producto'}
            variant="primary"
            onPress={submit}
            isBusy={isSaving}
          />
          {isEditing && <Button label="Eliminar producto" variant="danger" onPress={confirmDelete} isDisabled={isSaving} />}
        </>
      }
    >
      <View style={styles.form}>
        <Field label="Nombre" value={fields.name} onChangeText={set('name')} maxLength={80} autoFocus={!isEditing} returnKeyType="next" />
        <Field label="Precio" prefix="$" value={fields.price} onChangeText={set('price')} keyboardType="number-pad" placeholder="2500" />
        <Field label="Código (opcional)" value={fields.code} onChangeText={set('code')} maxLength={40} autoCapitalize="characters" autoCorrect={false} />
        {error && <Notice>{error}</Notice>}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: space(4) },
});
