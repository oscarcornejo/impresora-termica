// Mensajes de inicio de sesión de Supabase Auth en palabras de quien vende.

interface AuthErrorLike {
  code?: string;
  status?: number;
  message?: string;
}

const OFFLINE = 'Sin conexión a internet. Para entrar la primera vez hace falta conexión.';
const RATE_LIMIT_STATUS = 429;

export function signInErrorMessage(error: unknown): string {
  if (error instanceof TypeError) return OFFLINE;
  const { code, status, message } = (error ?? {}) as AuthErrorLike;
  if (code === 'invalid_credentials') return 'Correo o contraseña incorrectos.';
  if (code === 'email_not_confirmed') return 'Falta confirmar el correo de la cuenta. Revisa el correo de Supabase o confírmalo desde el panel.';
  if (status === RATE_LIMIT_STATUS) return 'Demasiados intentos. Espera unos minutos y vuelve a intentar.';
  if (/fetch|network/i.test(message ?? '')) return OFFLINE;
  return message ? `No se pudo iniciar sesión: ${message}` : 'No se pudo iniciar sesión. Vuelve a intentar.';
}
