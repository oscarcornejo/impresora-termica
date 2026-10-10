import { describe, expect, test } from 'vitest';
import { searchProducts, sortByName } from './productSearch';
import type { Product } from './types';

const product = (id: number, name: string, code: string | null = null): Product =>
  ({ id, name, price: 100, code, createdAt: '', updatedAt: '' });
const list = [product(1, 'Jugo', 'JG-1'), product(2, 'Café americano', 'CAF'), product(3, 'alfajor')];

describe('búsqueda de productos', () => {
  test('ordena por nombre sin importar mayúsculas', () => {
    expect(sortByName(list).map((p) => p.name)).toEqual(['alfajor', 'Café americano', 'Jugo']);
  });

  test('busca por nombre o código sin importar mayúsculas ni tildes', () => {
    expect(searchProducts(list, 'cafe').map((p) => p.id)).toEqual([2]);
    expect(searchProducts(list, 'jg-').map((p) => p.id)).toEqual([1]);
    expect(searchProducts(list, 'té')).toEqual([]);
  });

  test('sin texto devuelve todo, ordenado', () => {
    expect(searchProducts(list, '  ').map((p) => p.id)).toEqual([3, 2, 1]);
  });
});
