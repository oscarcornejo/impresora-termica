import { describe, expect, test } from 'vitest';
import { businessSchema, parseOrThrow, productInputSchema } from './schemas';

describe('validación antes de guardar', () => {
  test('producto: nombre obligatorio y precio entero', () => {
    expect(() => parseOrThrow(productInputSchema, { name: '  ', price: 100, code: null })).toThrow('El nombre es obligatorio');
    expect(() => parseOrThrow(productInputSchema, { name: 'Té', price: 10.5, code: null })).toThrow('entero');
  });

  test('producto: recorta espacios y guarda código vacío como null', () => {
    expect(parseOrThrow(productInputSchema, { name: '  Té  ', price: 900, code: '   ' })).toEqual({ name: 'Té', price: 900, code: null });
  });

  test('negocio: nombre obligatorio, el resto opcional', () => {
    expect(() => parseOrThrow(businessSchema, { name: ' ' })).toThrow('obligatorio');
    expect(parseOrThrow(businessSchema, { name: ' Mati Ventas ' })).toEqual({ name: 'Mati Ventas', address: '', phone: '', footer: '' });
  });
});
