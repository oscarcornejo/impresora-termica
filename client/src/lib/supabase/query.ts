import { OfflineError, toAppError } from './errors';

// supabase-js reintenta con espera creciente cuando falla la red: sin señal, eso dejaba ~15 s la app cargando.
const browserOfflineCheck = () => typeof navigator !== 'undefined' && (navigator as { onLine?: boolean }).onLine === false;
let isKnownOffline: () => boolean = browserOfflineCheck;

/** Otra forma de saber si no hay red (en iPhone no existe navigator.onLine). `null` vuelve a la del navegador. */
export function setOfflineCheck(check: (() => boolean) | null): void {
  isKnownOffline = check ?? browserOfflineCheck;
}

/** Ejecuta una consulta y traduce cualquier error (de red o de la base) a un mensaje de la app. */
export async function query<T>(run: () => PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  if (isKnownOffline()) throw new OfflineError();
  let result: { data: T; error: unknown };
  try {
    result = await run();
  } catch (err) {
    throw toAppError(err);
  }
  if (result.error) throw toAppError(result.error);
  return result.data;
}
