// Estado de la venta en curso: carrito, si ya se imprimió y el "deshacer" de Nueva venta.
import { useEffect, useReducer } from 'react';
import type { CartLine } from './types';

/** Tiempo que se ofrece "Deshacer" tras cerrar una venta. */
export const UNDO_MS = 8000;

export interface SaleState {
  cart: CartLine[];
  /** Carrito que se imprimió por última vez; la venta está cerrada mientras siga siendo el actual. */
  printedCart: CartLine[] | null;
  undo: { cart: CartLine[]; wasPrinted: boolean } | null;
}

export type SaleAction =
  | { type: 'update'; update: (prev: CartLine[]) => CartLine[] }
  | { type: 'printed'; cart: CartLine[] }
  | { type: 'newSale' }
  | { type: 'undo' }
  | { type: 'expireUndo' };

export const INITIAL_SALE: SaleState = { cart: [], printedCart: null, undo: null };

// El carrito es inmutable: si la referencia impresa es la actual, nada cambió desde que se imprimió.
export const isSaleDone = (state: SaleState) => state.cart.length > 0 && state.printedCart === state.cart;

export function saleReducer(state: SaleState, action: SaleAction): SaleState {
  switch (action.type) {
    case 'update': {
      const cart = action.update(state.cart);
      // Tocar el carrito descarta el deshacer: restaurar pisaría lo que se acaba de agregar.
      return cart === state.cart ? state : { ...state, cart, undo: null };
    }
    case 'printed':
      return { ...state, printedCart: action.cart };
    case 'newSale':
      if (state.cart.length === 0) return state;
      return { cart: [], printedCart: null, undo: { cart: state.cart, wasPrinted: isSaleDone(state) } };
    case 'undo':
      if (!state.undo) return state;
      return {
        cart: state.undo.cart,
        printedCart: state.undo.wasPrinted ? state.undo.cart : null,
        undo: null,
      };
    case 'expireUndo':
      return state.undo ? { ...state, undo: null } : state;
  }
}

export interface SaleSession {
  cart: CartLine[];
  isDone: boolean;
  canUndo: boolean;
  updateCart: (update: (prev: CartLine[]) => CartLine[]) => void;
  markPrinted: (cart: CartLine[]) => void;
  newSale: () => void;
  undo: () => void;
}

export function useSaleSession(): SaleSession {
  const [state, dispatch] = useReducer(saleReducer, INITIAL_SALE);

  useEffect(() => {
    if (!state.undo) return;
    const timer = setTimeout(() => dispatch({ type: 'expireUndo' }), UNDO_MS);
    return () => clearTimeout(timer);
  }, [state.undo]);

  return {
    cart: state.cart,
    isDone: isSaleDone(state),
    canUndo: state.undo !== null,
    updateCart: (update) => dispatch({ type: 'update', update }),
    markPrinted: (cart) => dispatch({ type: 'printed', cart }),
    newSale: () => dispatch({ type: 'newSale' }),
    undo: () => dispatch({ type: 'undo' }),
  };
}
