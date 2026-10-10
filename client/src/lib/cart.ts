// Operaciones del carrito de venta. Todas devuelven un arreglo nuevo.
import type { CartLine, Product } from './types';

const MAX_QUANTITY = 999;

export function addProduct(cart: CartLine[], product: Pick<Product, 'id' | 'name' | 'price'>): CartLine[] {
  const existing = cart.find((line) => line.productId === product.id);
  if (existing) return changeQuantity(cart, product.id, 1);
  return [...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
}

/** Suma `delta` a la cantidad; si llega a 0 la línea se elimina. */
export function changeQuantity(cart: CartLine[], productId: number, delta: number): CartLine[] {
  return cart
    .map((line) =>
      line.productId === productId
        ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + delta) }
        : line,
    )
    .filter((line) => line.quantity > 0);
}

export function removeLine(cart: CartLine[], productId: number): CartLine[] {
  return cart.filter((line) => line.productId !== productId);
}

export const lineTotal = (line: CartLine) => line.price * line.quantity;

export const cartTotal = (cart: CartLine[]) => cart.reduce((sum, line) => sum + lineTotal(line), 0);

export const cartCount = (cart: CartLine[]) => cart.reduce((sum, line) => sum + line.quantity, 0);

/** Unidades de un producto en la venta (0 si no está). */
export const quantityOf = (cart: CartLine[], productId: number) =>
  cart.find((line) => line.productId === productId)?.quantity ?? 0;
