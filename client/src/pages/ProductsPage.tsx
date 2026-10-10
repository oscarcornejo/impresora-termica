import { useState } from 'react';
import { ProductForm } from '../components/ProductForm';
import { BusinessForm } from '../components/BusinessForm';
import { Icon } from '../components/Icon';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/money';
import type { Business, Product } from '../lib/types';

interface ProductsPageProps {
  business: Business | null;
  onBusinessSave: (business: Business) => Promise<unknown>;
}

export function ProductsPage({ business, onBusinessSave }: ProductsPageProps) {
  const { products, search, setSearch, isLoading, error, save, remove } = useProducts();
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleSubmit(input: Parameters<typeof save>[0]) {
    await save(input, editing?.id);
    setEditing(null);
  }

  async function handleDelete(id: number) {
    setActionError(null);
    try {
      await remove(id);
      if (editing?.id === id) setEditing(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar');
    } finally {
      setConfirmingId(null);
    }
  }

  const listMessage = search
    ? 'Ningún producto coincide con la búsqueda.'
    : 'Aún no hay productos. Agrega el primero con el formulario.';

  return (
    <div className="page page-products">
      {/* En pantallas angostas el formulario va primero: agregar un producto no obliga a recorrer todo el catálogo */}
      <div className="products-form">
        <ProductForm key={editing?.id ?? 'new'} product={editing} onSubmit={handleSubmit} onCancel={() => setEditing(null)} />
      </div>

      <section className="panel products-list" aria-labelledby="products-title">
        <div className="editor-head">
          <h2 id="products-title">Productos {!isLoading && <span className="count">{products.length}</span>}</h2>
          <input
            className="search"
            type="search"
            placeholder="Buscar por nombre o código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar productos"
          />
        </div>
        {(error ?? actionError) && <p className="warning" role="alert">{error ?? actionError}</p>}
        {!isLoading && products.length === 0 ? (
          <p className="empty">{listMessage}</p>
        ) : (
          <ul className="product-rows">
            {products.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                isEditing={editing?.id === p.id}
                isConfirming={confirmingId === p.id}
                onEdit={() => setEditing(p)}
                onAskDelete={() => setConfirmingId(p.id)}
                onCancelDelete={() => setConfirmingId(null)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {business && (
        <div className="products-business">
          <BusinessForm business={business} onSave={onBusinessSave} />
        </div>
      )}
    </div>
  );
}

interface ProductRowProps {
  product: Product;
  isEditing: boolean;
  isConfirming: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}

// Una fila por producto: en columnas si hay ancho; en tarjeta (nombre arriba, código y precio abajo) si no.
function ProductRow({ product, isEditing, isConfirming, onEdit, onAskDelete, onCancelDelete, onDelete }: ProductRowProps) {
  return (
    <li className={`product-row ${isEditing ? 'is-selected' : ''}`}>
      <span className="product-row-name">{product.name}</span>
      <span className="product-row-meta">
        <span className={`product-row-code ${product.code ? '' : 'is-empty'}`}>
          {product.code ?? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Sin código</span>
            </>
          )}
        </span>
        <span className="product-row-price">{formatPrice(product.price)}</span>
      </span>
      <div className="product-row-actions">
        {isConfirming ? (
          <>
            <button className="danger-solid" onClick={onDelete}>Eliminar</button>
            <button className="secondary" onClick={onCancelDelete}>No</button>
          </>
        ) : (
          <>
            <button className="secondary" onClick={onEdit} aria-label={`Editar ${product.name}`}>Editar</button>
            <button className="icon danger" aria-label={`Eliminar ${product.name}`} onClick={onAskDelete}>
              <Icon name="close" size={18} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
