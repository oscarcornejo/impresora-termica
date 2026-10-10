import { describe, expect, test } from 'vitest';
import { toBusiness, toProduct } from './rows';

describe('filas de la base a objetos de la app', () => {
  test('producto: snake_case a camelCase', () => {
    expect(toProduct({ id: 7, name: 'Té', price: 900, code: null, created_at: 'a', updated_at: 'b' }))
      .toEqual({ id: 7, name: 'Té', price: 900, code: null, createdAt: 'a', updatedAt: 'b' });
  });

  test('producto inválido lanza en vez de mostrar datos rotos', () => {
    expect(() => toProduct({ id: 'x', name: 'Té' })).toThrow();
  });

  test('negocio: solo los campos del comprobante', () => {
    expect(toBusiness({ id: 1, name: 'Mati Ventas', address: 'Villarrica', phone: '-', footer: 'Gracias' }))
      .toEqual({ name: 'Mati Ventas', address: 'Villarrica', phone: '-', footer: 'Gracias' });
  });
});
