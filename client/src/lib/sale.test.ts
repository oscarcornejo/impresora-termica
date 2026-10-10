import { describe, expect, test } from 'vitest';
import { addProduct, cartCount, cartTotal, changeQuantity, quantityOf, removeLine } from './cart';
import { formatPrice, parsePrice } from './money';
import { RECEIPT_LEGEND, buildSaleReceipt, fitText, formatReceiptDate, itemLine } from './receipt';
import type { Business, TextBlock } from './types';

const cafe = { id: 1, name: 'Café', price: 2500 };
const jugo = { id: 2, name: 'Jugo natural', price: 3200 };

describe('dinero', () => {
  test('formatPrice usa formato chileno', () => {
    expect(formatPrice(5000)).toBe('$5.000');
    expect(formatPrice(0)).toBe('$0');
  });

  test('parsePrice acepta puntos y signo $, rechaza decimales y texto', () => {
    expect(parsePrice('5.000')).toBe(5000);
    expect(parsePrice('$ 1200')).toBe(1200);
    expect(parsePrice('12,5')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('')).toBeNull();
  });
});

describe('carrito', () => {
  test('agregar el mismo producto suma cantidad sin mutar', () => {
    const one = addProduct([], cafe);
    const two = addProduct(one, cafe);
    expect(one[0].quantity).toBe(1);
    expect(two).toEqual([{ productId: 1, name: 'Café', price: 2500, quantity: 2 }]);
  });

  test('bajar la cantidad a 0 elimina la línea', () => {
    expect(changeQuantity(addProduct([], cafe), 1, -1)).toEqual([]);
  });

  test('totales y conteo', () => {
    const cart = addProduct(addProduct(addProduct([], cafe), cafe), jugo);
    expect(cartTotal(cart)).toBe(8200);
    expect(cartCount(cart)).toBe(3);
    expect(removeLine(cart, 1)).toHaveLength(1);
  });

  test('cantidad de un producto en la venta: 0 si no está', () => {
    const cart = addProduct(addProduct(addProduct([], cafe), cafe), jugo);
    expect(quantityOf(cart, 1)).toBe(2);
    expect(quantityOf(cart, 2)).toBe(1);
    expect(quantityOf(cart, 99)).toBe(0);
  });
});

describe('comprobante', () => {
  const business: Business = { name: 'MI CAFÉ', address: 'Calle 1', phone: '', footer: '¡Gracias!' };

  test('fitText recorta con un punto, sin espacio colgando', () => {
    expect(fitText('Sándwich de pollo', 10)).toBe('Sándwich.');
    expect(fitText('Sándwich de pollo', 13)).toBe('Sándwich de.');
    expect(fitText('Té', 10)).toBe('Té');
  });

  test('itemLine ocupa exactamente el ancho y conserva el precio', () => {
    const line = itemLine({ productId: 1, name: 'Hamburguesa doble con queso y tocino', price: 6990, quantity: 2 }, 32);
    expect(Array.from(line)).toHaveLength(32);
    expect(line.endsWith('$13.980')).toBe(true);
  });

  test('buildSaleReceipt incluye encabezado, ítems, total y pie; omite contacto vacío', () => {
    const lines = addProduct(addProduct([], cafe), jugo);
    const blocks = buildSaleReceipt({ business, lines, chars: 32, date: new Date(2026, 9, 9, 12, 0) });
    const texts = blocks.filter((b): b is TextBlock & { id: string } => b.type === 'text').map((b) => b.text);
    expect(texts[0]).toBe('MI CAFÉ');
    expect(texts[1]).toBe('Calle 1');
    expect(texts.some((t) => t.includes('1 x Jugo natural') && t.endsWith('$3.200'))).toBe(true);
    expect(texts.some((t) => t.startsWith('TOTAL') && t.endsWith('$5.700'))).toBe(true);
    expect(texts[texts.length - 1]).toBe('¡Gracias!');
  });

  test('buildSaleReceipt aclara en el papel que no es un documento tributario, en una línea ASCII', () => {
    const blocks = buildSaleReceipt({ business, lines: addProduct([], cafe), chars: 32 });
    const legend = blocks.find((b): b is TextBlock & { id: string } => b.type === 'text' && b.text === RECEIPT_LEGEND);
    expect(legend?.align).toBe('center');
    expect(Array.from(RECEIPT_LEGEND).length).toBeLessThanOrEqual(32);
    expect(/^[\x20-\x7e]+$/.test(RECEIPT_LEGEND)).toBe(true);
  });
});

test('formatReceiptDate usa 24 h y solo caracteres ASCII imprimibles', () => {
  const text = formatReceiptDate(new Date(2026, 9, 9, 0, 37));
  expect(text).toBe('09-10-2026 00:37');
  expect(/^[\x20-\x7e]+$/.test(text)).toBe(true);
});
