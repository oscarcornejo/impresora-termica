import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { loadWithCache } from './cache';
import { createMemoryStorage } from './memoryStorage';
import { OfflineError } from '../supabase/errors';

const schema = z.array(z.number());
const KEY = 'cache-test';

describe('caché para vender sin conexión', () => {
  test('con conexión devuelve lo remoto y lo guarda', async () => {
    const storage = createMemoryStorage();
    const result = await loadWithCache({ storage, key: KEY, schema, load: async () => [1, 2] });
    expect(result).toEqual({ data: [1, 2], isOffline: false });
    expect(JSON.parse(storage.getItem(KEY) ?? '')).toEqual([1, 2]);
  });

  test('sin conexión devuelve la copia guardada', async () => {
    const storage = createMemoryStorage({ [KEY]: '[3]' });
    const result = await loadWithCache({ storage, key: KEY, schema, load: async () => { throw new OfflineError(); } });
    expect(result).toEqual({ data: [3], isOffline: true });
  });

  test('sin conexión y sin copia: avisa que falta conexión', async () => {
    const load = async () => { throw new OfflineError(); };
    await expect(loadWithCache({ storage: createMemoryStorage(), key: KEY, schema, load })).rejects.toBeInstanceOf(OfflineError);
  });

  test('otros errores no se tapan con la copia', async () => {
    const storage = createMemoryStorage({ [KEY]: '[3]' });
    const load = async () => { throw new Error('sin acceso'); };
    await expect(loadWithCache({ storage, key: KEY, schema, load })).rejects.toThrow('sin acceso');
  });
});
