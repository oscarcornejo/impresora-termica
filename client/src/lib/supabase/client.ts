// Cliente de Supabase. La clave pública (anon/publishable) puede ir en el navegador:
// el acceso lo controlan las políticas de Row Level Security de la base.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const MISSING_CONFIG = 'Falta configurar la base de datos: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (en client/.env.local y en Netlify).';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) throw new Error(MISSING_CONFIG);
  client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}
