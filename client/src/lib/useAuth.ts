import { useCallback, useEffect, useState } from 'react';
import { isAuthRetryableFetchError, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase/client';
import { signInErrorMessage } from './supabase/auth';
import { OfflineError, toAppError } from './supabase/errors';
import { query } from './supabase/query';
import { CATALOG_CACHE_KEY, clearCaches } from './storage/cache';
import { browserStorage } from './storage/store';

export type AuthState =
  | { status: 'checking' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; email: string }
  /** Entró, pero la cuenta no está en `members`: la base no le mostraría nada. */
  | { status: 'noAccess'; email: string }
  | { status: 'error'; message: string };

const ACCOUNT_LABEL = 'cuenta del negocio';
const emailOf = (session: Session) => session.user.email ?? ACCOUNT_LABEL;

/** Solo hay copia del catálogo si alguien ya entró en este dispositivo. */
function hasCachedCatalog(): boolean {
  try {
    return browserStorage().getItem(CATALOG_CACHE_KEY) !== null;
  } catch {
    return false;
  }
}

/** ¿La cuenta está autorizada? Sin conexión se asume que sí: la copia guardada solo existe si ya entró antes. */
async function resolveAccess(db: SupabaseClient, session: Session): Promise<AuthState> {
  try {
    const rows = await query(() => db.from('members').select('user_id').eq('user_id', session.user.id));
    return rows?.length ? { status: 'signedIn', email: emailOf(session) } : { status: 'noAccess', email: emailOf(session) };
  } catch (err) {
    if (err instanceof OfflineError) return { status: 'signedIn', email: emailOf(session) };
    return { status: 'error', message: toAppError(err).message };
  }
}

/** Sesión de Supabase guardada en el dispositivo: no hay que entrar cada vez. */
export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'checking' });

  useEffect(() => {
    let db: SupabaseClient;
    try {
      db = getSupabase();
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      return;
    }
    let isCancelled = false;
    const apply = async (session: Session | null) => {
      const next = session ? await resolveAccess(db, session) : ({ status: 'signedOut' } as const);
      if (!isCancelled) setState(next);
    };
    db.auth.getSession().then(({ data, error }) => {
      // Sesión vencida y sin señal: no se puede renovar, pero se puede seguir vendiendo con la copia guardada.
      if (error && isAuthRetryableFetchError(error) && hasCachedCatalog()) {
        if (!isCancelled) setState({ status: 'signedIn', email: ACCOUNT_LABEL });
        return;
      }
      void apply(data.session);
    });
    const { data: subscription } = db.auth.onAuthStateChange((event, session) => {
      // Al refrescar el token no cambia quién es: no volver a consultar `members`.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void apply(session);
    });
    return () => {
      isCancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  /** Devuelve el mensaje de error, o null si entró. */
  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
      return error ? signInErrorMessage(error) : null;
    } catch (err) {
      return signInErrorMessage(err);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      clearCaches(browserStorage());
    } finally {
      // scope local: cierra la sesión en este dispositivo, no en los demás que usan la misma cuenta.
      await getSupabase().auth.signOut({ scope: 'local' });
    }
  }, []);

  return { state, signIn, signOut };
}
