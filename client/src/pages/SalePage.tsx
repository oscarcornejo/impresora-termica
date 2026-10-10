import { useEffect, useMemo, useState } from 'react';
import type { PrintControls } from '../components/PrintPanel';
import { CheckoutBar } from '../components/CheckoutBar';
import { ReceiptPreview } from '../components/ReceiptPreview';
import { Icon } from '../components/Icon';
import { useProducts } from '../lib/useProducts';
import { webData } from '../lib/storage';
import { addProduct, cartCount, cartTotal, changeQuantity, lineTotal, quantityOf, removeLine } from '../lib/cart';
import { withTearLine } from '../lib/blocks';
import { formatPrice } from '../lib/money';
import { buildSaleReceipt } from '../lib/receipt';
import { catalogDensity } from '../lib/catalog';
import type { SaleSession } from '../lib/saleSession';
import { PAPER_CHARS, type Business, type EditorBlock } from '../lib/types';

interface SalePageProps {
  business: Business | null;
  sale: SaleSession;
  /** Cierra la venta (con deshacer) y limpia los avisos de la anterior. */
  onNewSale: () => void;
  controls: PrintControls;
  onEditInDesigner: (blocks: EditorBlock[]) => void;
  onGoToProducts: () => void;
}

export function SalePage({ business, sale, onNewSale, controls, onEditInDesigner, onGoToProducts }: SalePageProps) {
  const { cart, updateCart: onCartChange } = sale;
  const { products, search, setSearch, isLoading, isOffline, error } = useProducts(webData);
  // Cajón de la venta: solo aplica en pantallas angostas; en escritorio la venta siempre está a la vista.
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const isCartEmpty = cart.length === 0;

  // Sin productos no hay nada que mostrar: el cajón se cierra para no quedar abierto con el botón desactivado.
  useEffect(() => {
    if (isCartEmpty) setIsTicketOpen(false);
  }, [isCartEmpty]);

  useEffect(() => {
    if (!isTicketOpen) return;
    const closeOnEscape = (e: KeyboardEvent) => e.key === 'Escape' && setIsTicketOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isTicketOpen]);

  const receipt = useMemo(
    () => (business && cart.length > 0
      ? buildSaleReceipt({ business, lines: cart, chars: PAPER_CHARS[controls.paperWidth] })
      : []),
    [business, cart, controls.paperWidth],
  );
  const previewBlocks = controls.hasTearLine ? withTearLine(receipt) : receipt;

  async function printSale() {
    // Se guarda el carrito impreso: si cambia mientras imprime, la venta no se da por cerrada.
    const printedCart = cart;
    if (!(await controls.print(receipt))) return;
    sale.markPrinted(printedCart);
    setIsTicketOpen(false);
  }

  const hasNoProducts = !isLoading && products.length === 0 && !search;
  const hasNoResults = !isLoading && products.length === 0 && Boolean(search);

  return (
    <div className="page sale-page">
      {/* Con teclado, el cobro queda al final de todo el catálogo: este atajo lleva directo. */}
      <a className="skip-link" href="#checkout">Ir al cobro</a>
      <section className="panel sale-catalog" aria-labelledby="catalog-title">
        <div className="editor-head">
          <h2 id="catalog-title">Productos</h2>
          <input
            className="search"
            type="search"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar productos"
          />
        </div>
        {error && <p className="warning" role="alert">{error}</p>}
        {isOffline && <p className="offline-note" role="status">Sin conexión: vendes con el catálogo guardado en este dispositivo.</p>}
        {hasNoProducts && (
          <div className="empty">
            <p>Aún no hay productos cargados.</p>
            <button onClick={onGoToProducts}>Cargar productos</button>
          </div>
        )}
        {hasNoResults && <p className="empty">Ningún producto coincide con “{search.trim()}”.</p>}
        {products.length > 0 && (
          <ul className="catalog" data-density={catalogDensity(products.length)}>
            {products.map((p) => {
              const inCart = quantityOf(cart, p.id);
              return (
                <li key={p.id}>
                  <button
                    className={`product-tile ${inCart > 0 ? 'is-in-cart' : ''}`}
                    aria-label={`${p.name}, ${formatPrice(p.price)}${inCart > 0 ? `, ${inCart} en la venta` : ''}`}
                    onClick={() => onCartChange((prev) => addProduct(prev, p))}
                  >
                    <span className="product-name">{p.name}</span>
                    <span className="tile-foot">
                      <span className="product-price">{formatPrice(p.price)}</span>
                      {/* Cuántas ya van en la venta: se ve sin abrir el cajón */}
                      {inCart > 0 && <span className="tile-qty" aria-hidden="true">×{inCart}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* En pantallas angostas la venta sube como cajón pegado a la barra de cobro; en escritorio es la columna derecha. */}
      <div className="sale-dock">
        <aside id="sale-ticket" className={`sale-ticket ${isTicketOpen ? 'is-open' : ''}`} aria-labelledby="cart-title">
          {/* El encabezado queda fuera del área con scroll: "Nueva venta" siempre a la vista */}
          <div className="editor-head ticket-head">
            <h2 id="cart-title">
              Venta{' '}
              {cart.length > 0 && (
                <span className="count" aria-label={unitsLabel(cartCount(cart))}>{cartCount(cart)}</span>
              )}
            </h2>
            {/* Ya impresa, "Nueva venta" es el botón principal del cobro: no se repite aquí */}
            {cart.length > 0 && !sale.isDone && (
              <button className="secondary" onClick={onNewSale}>Nueva venta</button>
            )}
          </div>
          <div className="ticket-body">
            <section className="cart" aria-label="Productos de la venta">
              {cart.length === 0 ? (
                <p className="hint">Toca un producto para agregarlo.</p>
              ) : (
                <CartLines cart={cart} onCartChange={onCartChange} />
              )}
            </section>
            {receipt.length > 0 && (
              <div className="sale-receipt">
                <div className="preview-scroll">
                  <ReceiptPreview blocks={previewBlocks} paperWidth={controls.paperWidth} />
                </div>
                <button className="link" onClick={() => onEditInDesigner(receipt)}>Editar en el diseñador</button>
              </div>
            )}
          </div>
        </aside>

        <CheckoutBar
          total={cartTotal(cart)}
          itemCount={cartCount(cart)}
          controls={controls}
          canPrint={receipt.length > 0}
          onPrint={printSale}
          isSaleDone={sale.isDone}
          onNewSale={onNewSale}
          canUndo={sale.canUndo}
          onUndo={sale.undo}
          isTicketOpen={isTicketOpen}
          onToggleTicket={() => setIsTicketOpen((open) => !open)}
        />
      </div>
    </div>
  );
}

const unitsLabel = (count: number) => (count === 1 ? '1 producto' : `${count} productos`);

interface CartLinesProps {
  cart: SaleSession['cart'];
  onCartChange: SaleSession['updateCart'];
}

function CartLines({ cart, onCartChange }: CartLinesProps) {
  return (
    <ul className="cart-lines">
      {cart.map((line) => (
        <li key={line.productId}>
          <span className="cart-name">{line.name}</span>
          <div className="qty" role="group" aria-label={`Cantidad de ${line.name}`}>
            <button
              className="qty-btn"
              aria-label={`Uno menos de ${line.name}`}
              onClick={() => onCartChange((prev) => changeQuantity(prev, line.productId, -1))}
            >
              <Icon name="minus" />
            </button>
            <span className="qty-value">{line.quantity}</span>
            <button
              className="qty-btn"
              aria-label={`Uno más de ${line.name}`}
              onClick={() => onCartChange((prev) => changeQuantity(prev, line.productId, 1))}
            >
              <Icon name="plus" />
            </button>
          </div>
          <span className="num">{formatPrice(lineTotal(line))}</span>
          <button
            className="icon danger line-remove"
            aria-label={`Quitar ${line.name} de la venta`}
            onClick={() => onCartChange((prev) => removeLine(prev, line.productId))}
          >
            <Icon name="close" size={18} />
          </button>
        </li>
      ))}
    </ul>
  );
}
