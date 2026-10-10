// El código compartido lee la copia sin conexión de forma síncrona (como localStorage).
// En el teléfono se carga todo al abrir la app y cada cambio se guarda en segundo plano.
import type { SyncStorage } from '@core/storage/store';

export interface AsyncBackend {
  getMany(keys: string[]): Promise<Record<string, string | null>>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const logPersistError = (err: unknown) => console.warn('No se pudo guardar la copia sin conexión', err);

export async function createPersistentStorage(backend: AsyncBackend, keys: string[]): Promise<SyncStorage> {
  const loaded = await backend.getMany(keys).catch(() => ({}) as Record<string, string | null>);
  let data = new Map(Object.entries(loaded).filter((entry): entry is [string, string] => entry[1] !== null));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data = new Map(data).set(key, value);
      backend.setItem(key, value).catch(logPersistError);
    },
    removeItem: (key) => {
      const next = new Map(data);
      next.delete(key);
      data = next;
      backend.removeItem(key).catch(logPersistError);
    },
  };
}
