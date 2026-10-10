import { OfflineError, toAppError } from './errors';

// supabase-js reintenta con espera creciente cuando falla la red: sin señal, eso dejaba ~15 s la app cargando.
const isKnownOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

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
