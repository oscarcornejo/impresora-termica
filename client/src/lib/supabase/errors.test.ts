import { describe, expect, test } from 'vitest';
import { OfflineError, toAppError } from './errors';

describe('errores de Supabase en palabras de la app', () => {
  test('código repetido', () => {
    expect(toAppError({ code: '23505', message: 'duplicate key' }).message).toBe('Ya existe un producto con ese código');
  });

  test('sin permiso (RLS)', () => {
    expect(toAppError({ code: '42501', message: 'denied' }).message).toMatch(/no tiene acceso/);
  });

  test('sin conexión: fallo de fetch', () => {
    const error = toAppError(new TypeError('Failed to fetch'));
    expect(error).toBeInstanceOf(OfflineError);
    expect(error.message).toMatch(/Sin conexión/);
  });

  test('sesión vencida', () => {
    expect(toAppError({ code: 'PGRST301', message: 'JWT expired' }).message).toMatch(/Vuelve a iniciar sesión/);
  });

  test('otro error conserva un mensaje entendible', () => {
    expect(toAppError({ code: 'XX000', message: 'boom' }).message).toMatch(/boom/);
    expect(toAppError(undefined).message).toMatch(/Algo falló/);
  });
});
