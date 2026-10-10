// Traduce los errores de Supabase (Postgres, PostgREST, red) a mensajes para quien vende.

const OFFLINE = 'Sin conexión a internet. Puedes seguir vendiendo con el catálogo guardado; para cargar o editar productos, conéctate y vuelve a intentar.';
const NO_ACCESS = 'Esta cuenta no tiene acceso a los datos del negocio. Entra con la cuenta del negocio.';
const SESSION_EXPIRED = 'La sesión venció. Vuelve a iniciar sesión.';

export class OfflineError extends Error {
  constructor() {
    super(OFFLINE);
    this.name = 'OfflineError';
  }
}

const MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  '23505': 'Ya existe un producto con ese código',
  '42501': NO_ACCESS,
  PGRST301: SESSION_EXPIRED,
  PGRST303: SESSION_EXPIRED,
  '23514': 'Algún dato no es válido (nombre, precio o código fuera de rango).',
});

interface ErrorLike {
  code?: string;
  message?: string;
}

const isNetworkError = (error: unknown) =>
  error instanceof TypeError || /failed to fetch|network|load failed/i.test((error as ErrorLike)?.message ?? '');

export function toAppError(error: unknown): Error {
  if (error instanceof OfflineError) return error;
  if (isNetworkError(error)) return new OfflineError();
  const { code, message } = (error ?? {}) as ErrorLike;
  if (code && MESSAGES[code]) return new Error(MESSAGES[code]);
  return new Error(message ? `Algo falló al guardar o leer los datos: ${message}` : 'Algo falló sin dar detalles. Vuelve a intentar.');
}
