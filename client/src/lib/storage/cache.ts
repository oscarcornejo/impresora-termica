// Copia local de lo último leído de la base: permite vender sin conexión en la feria.
import type { z } from 'zod';
import { OfflineError } from '../supabase/errors';
import { readJson, writeJson, type SyncStorage } from './store';

export const CATALOG_CACHE_KEY = 'impresora-termica:cache:products:v1';
export const BUSINESS_CACHE_KEY = 'impresora-termica:cache:business:v1';

interface LoadOptions<T> {
  storage: SyncStorage;
  key: string;
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  load: () => Promise<T>;
}

export interface Loaded<T> {
  data: T;
  /** true: sin conexión, `data` es la copia guardada en el dispositivo. */
  isOffline: boolean;
}

export async function loadWithCache<T>({ storage, key, schema, load }: LoadOptions<T>): Promise<Loaded<T>> {
  try {
    const data = await load();
    try {
      writeJson(storage, key, data);
    } catch {
      // Sin espacio para la copia: la app sigue funcionando con conexión.
    }
    return { data, isOffline: false };
  } catch (err) {
    if (!(err instanceof OfflineError)) throw err;
    const cached = readJson<T | null>(storage, key, schema.nullable(), null);
    if (cached === null) throw err;
    return { data: cached, isOffline: true };
  }
}

/** Al cerrar sesión: que el próximo en usar el dispositivo no vea el catálogo. */
export function clearCaches(storage: SyncStorage): void {
  [CATALOG_CACHE_KEY, BUSINESS_CACHE_KEY].forEach((key) => storage.removeItem(key));
}
