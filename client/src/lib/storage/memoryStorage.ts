import type { SyncStorage } from './store';

/** Almacenamiento en memoria con la interfaz que usa la app (pruebas, y base del de iPhone). */
export function createMemoryStorage(initial: Record<string, string> = {}): SyncStorage {
  let data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data = new Map(data).set(key, String(value)); },
    removeItem: (key) => { const next = new Map(data); next.delete(key); data = next; },
  };
}
