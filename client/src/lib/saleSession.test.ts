import { describe, expect, test } from 'vitest';
import { addProduct } from './cart';
import { INITIAL_SALE, isSaleDone, saleReducer, type SaleState } from './saleSession';

const cafe = { id: 1, name: 'Café', price: 2500 };
const jugo = { id: 2, name: 'Jugo natural', price: 3200 };

const withCafe = (): SaleState => saleReducer(INITIAL_SALE, { type: 'update', update: (c) => addProduct(c, cafe) });

describe('sesión de venta', () => {
  test('la venta queda cerrada cuando se imprime el carrito actual', () => {
    const state = withCafe();
    const printed = saleReducer(state, { type: 'printed', cart: state.cart });
    expect(isSaleDone(state)).toBe(false);
    expect(isSaleDone(printed)).toBe(true);
  });

  test('cambiar el carrito después de imprimir reabre la venta', () => {
    const state = withCafe();
    const printed = saleReducer(state, { type: 'printed', cart: state.cart });
    const edited = saleReducer(printed, { type: 'update', update: (c) => addProduct(c, jugo) });
    expect(isSaleDone(edited)).toBe(false);
  });

  test('si el carrito cambió mientras se imprimía, la venta no queda cerrada', () => {
    const state = withCafe();
    const edited = saleReducer(state, { type: 'update', update: (c) => addProduct(c, jugo) });
    const printed = saleReducer(edited, { type: 'printed', cart: state.cart });
    expect(isSaleDone(printed)).toBe(false);
  });

  test('una actualización que no cambia nada devuelve el mismo estado', () => {
    const state = withCafe();
    expect(saleReducer(state, { type: 'update', update: (c) => c })).toBe(state);
  });

  test('nueva venta vacía el carrito y se puede deshacer, conservando el estado impreso', () => {
    const state = withCafe();
    const printed = saleReducer(state, { type: 'printed', cart: state.cart });
    const cleared = saleReducer(printed, { type: 'newSale' });
    expect(cleared.cart).toEqual([]);
    expect(cleared.undo).not.toBeNull();

    const restored = saleReducer(cleared, { type: 'undo' });
    expect(restored.cart).toEqual(state.cart);
    expect(restored.undo).toBeNull();
    expect(isSaleDone(restored)).toBe(true);
  });

  test('deshacer una venta no impresa la deja abierta', () => {
    const cleared = saleReducer(withCafe(), { type: 'newSale' });
    const restored = saleReducer(cleared, { type: 'undo' });
    expect(restored.cart).toHaveLength(1);
    expect(isSaleDone(restored)).toBe(false);
  });

  test('agregar un producto o vencer el plazo descarta el deshacer', () => {
    const cleared = saleReducer(withCafe(), { type: 'newSale' });
    const added = saleReducer(cleared, { type: 'update', update: (c) => addProduct(c, jugo) });
    expect(added.undo).toBeNull();
    expect(saleReducer(added, { type: 'undo' })).toBe(added);
    expect(saleReducer(cleared, { type: 'expireUndo' }).undo).toBeNull();
  });

  test('nueva venta con el carrito vacío no ofrece deshacer', () => {
    expect(saleReducer(INITIAL_SALE, { type: 'newSale' })).toBe(INITIAL_SALE);
  });

  test('no muta el estado anterior', () => {
    const state = withCafe();
    const snapshot = structuredClone(state);
    saleReducer(state, { type: 'newSale' });
    saleReducer(state, { type: 'update', update: (c) => addProduct(c, cafe) });
    expect(state).toEqual(snapshot);
  });
});
