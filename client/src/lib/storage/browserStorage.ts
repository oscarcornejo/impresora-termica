// Almacenamiento de la web (en iPhone se usa otro).
import { WRITE_FAILED, type SyncStorage } from './store';

/** localStorage si el navegador lo permite; si lo bloquea, la lectura falla con un aviso claro. */
export function browserStorage(): SyncStorage {
  try {
    return window.localStorage;
  } catch {
    throw new Error(WRITE_FAILED);
  }
}
