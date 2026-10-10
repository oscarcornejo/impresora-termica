import { afterEach, describe, expect, test, vi } from 'vitest';
import { query, setOfflineCheck } from './query';
import { OfflineError } from './errors';

afterEach(() => {
  vi.unstubAllGlobals();
  setOfflineCheck(null);
});

describe('consultas a la base', () => {
  test('sin red conocida falla al instante sin llamar a la base', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const run = vi.fn();
    await expect(query(run)).rejects.toBeInstanceOf(OfflineError);
    expect(run).not.toHaveBeenCalled();
  });

  test('usa el detector de red de la plataforma cuando se configura (iPhone: sin navigator.onLine)', async () => {
    vi.stubGlobal('navigator', {});
    setOfflineCheck(() => true);
    const run = vi.fn();
    await expect(query(run)).rejects.toBeInstanceOf(OfflineError);
    expect(run).not.toHaveBeenCalled();
  });

  test('con red devuelve los datos', async () => {
    vi.stubGlobal('navigator', { onLine: true });
    await expect(query(async () => ({ data: [1], error: null }))).resolves.toEqual([1]);
  });

  test('traduce el error de la base', async () => {
    vi.stubGlobal('navigator', { onLine: true });
    await expect(query(async () => ({ data: null, error: { code: '23505', message: 'dup' } }))).rejects.toThrow('Ya existe');
  });
});
