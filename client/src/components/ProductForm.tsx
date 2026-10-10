import { useRef, useState, type FormEvent } from 'react';
import { parsePrice } from '../lib/money';
import type { Product, ProductInput } from '../lib/types';

interface ProductFormProps {
  /** Producto en edición; `null` para crear uno nuevo. */
  product: Product | null;
  onSubmit: (input: ProductInput) => Promise<void>;
  onCancel: () => void;
}

const toFields = (product: Product | null) => ({
  name: product?.name ?? '',
  price: product ? String(product.price) : '',
  code: product?.code ?? '',
});

// El padre usa `key={product?.id ?? 'new'}` para reiniciar el formulario al cambiar de producto.
export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [fields, setFields] = useState(() => toFields(product));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const isEditing = product !== null;

  const set = (field: keyof typeof fields) => (value: string) => setFields((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const name = fields.name.trim();
    const price = parsePrice(fields.price);
    if (!name) return setError('Escribe el nombre del producto');
    if (price === null) return setError('El precio debe ser un número entero, por ejemplo 2500');

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({ name, price, code: fields.code.trim() || null });
      if (!isEditing) {
        setFields(toFields(null)); // Listo para cargar el siguiente.
        nameInput.current?.focus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel form" onSubmit={handleSubmit} noValidate>
      <h2>{isEditing ? 'Editar producto' : 'Nuevo producto'}</h2>
      <label className="field">
        <span>Nombre</span>
        {/* Solo al editar: entrar a Productos no debe abrir el teclado del celular sin que nadie lo pida */}
        <input ref={nameInput} value={fields.name} onChange={(e) => set('name')(e.target.value)} maxLength={80} autoFocus={isEditing} />
      </label>
      <div className="row">
        <label className="field">
          <span>Precio</span>
          <span className="money-input">
            <input value={fields.price} onChange={(e) => set('price')(e.target.value)} inputMode="numeric" placeholder="2500" />
          </span>
        </label>
        <label className="field">
          <span>Código (opcional)</span>
          <input value={fields.code} onChange={(e) => set('code')(e.target.value)} maxLength={40} />
        </label>
      </div>
      {error && <p className="warning" role="alert">{error}</p>}
      <div className="row">
        <button type="submit" disabled={isSaving}>{isSaving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Agregar producto'}</button>
        {isEditing && (
          <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        )}
      </div>
    </form>
  );
}
