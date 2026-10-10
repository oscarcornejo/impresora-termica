import { describe, expect, test } from 'vitest';
import { signInErrorMessage } from './auth';

describe('mensajes al iniciar sesión', () => {
  test('credenciales incorrectas', () => {
    expect(signInErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe('Correo o contraseña incorrectos.');
  });

  test('correo sin confirmar', () => {
    expect(signInErrorMessage({ code: 'email_not_confirmed', message: '' })).toMatch(/confirmar el correo/);
  });

  test('sin conexión', () => {
    expect(signInErrorMessage(new TypeError('Failed to fetch'))).toMatch(/Sin conexión/);
  });

  test('demasiados intentos', () => {
    expect(signInErrorMessage({ status: 429, message: 'rate limit' })).toMatch(/Demasiados intentos/);
  });
});
