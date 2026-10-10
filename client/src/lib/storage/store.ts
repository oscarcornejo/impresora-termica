// Lectura y escritura de JSON en el almacenamiento del navegador, validando lo que se lee.
import type { z } from 'zod';

const CORRUPT = 'Los datos guardados en este dispositivo están dañados y no se pueden leer. No se borró nada.';
const WRITE_FAILED = 'No se pudo guardar en este dispositivo. Revisa que el navegador permita guardar datos del sitio (y que no esté en modo incógnito) y vuelve a intentar.';

/** Lee `key`; `fallback` si no existe. Si lo guardado no es válido, lanza sin tocarlo. */
export function readJson<T>(storage: Storage, key: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>, fallback: T): T {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(CORRUPT);
  }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new Error(CORRUPT);
  return result.data;
}

export function writeJson(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error(WRITE_FAILED);
  }
}

/** localStorage si el navegador lo permite; si lo bloquea, la lectura falla con un aviso claro. */
export function browserStorage(): Storage {
  try {
    return window.localStorage;
  } catch {
    throw new Error(WRITE_FAILED);
  }
}
