import { describe, expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createDataAccess } from './dataAccess';
import { CATALOG_CACHE_KEY } from './storage/cache';
import { createMemoryStorage } from './storage/memoryStorage';

const ROW = { id: 1, name: 'Café', price: 2500, code: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' };

// Cadena mínima de supabase-js para `from('products').select().order().limit()`.
function fakeDb(result: Promise<{ data: unknown; error: unknown }>): SupabaseClient {
  const chain = { select: () => chain, order: () => chain, limit: () => result };
  return { from: () => chain } as unknown as SupabaseClient;
}

describe('acceso a datos compartido entre la web y el iPhone', () => {
  test('carga el catálogo de la base con el cliente recibido y lo guarda en el almacenamiento recibido', async () => {
    const storage = createMemoryStorage();
    const data = createDataAccess({ getDb: () => fakeDb(Promise.resolve({ data: [ROW], error: null })), storage: () => storage });

    const { data: products, isOffline } = await data.loadCatalog();

    expect(isOffline).toBe(false);
    expect(products.map((p) => p.name)).toEqual(['Café']);
    expect(storage.getItem(CATALOG_CACHE_KEY)).toContain('Café');
  });

  test('sin red usa la copia del almacenamiento recibido', async () => {
    const cached = [{ id: 1, name: 'Té', price: 1500, code: null, createdAt: 'x', updatedAt: 'x' }];
    const storage = createMemoryStorage({ [CATALOG_CACHE_KEY]: JSON.stringify(cached) });
    const data = createDataAccess({ getDb: () => fakeDb(Promise.reject(new TypeError('Network request failed'))), storage: () => storage });

    const result = await data.loadCatalog();

    expect(result).toEqual({ data: cached, isOffline: true });
  });
});
