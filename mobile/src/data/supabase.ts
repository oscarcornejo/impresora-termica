// Cliente de Supabase de la app. La clave pública puede ir en la app: el acceso lo controla
// Row Level Security en la base. La sesión queda guardada en el teléfono.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config.local';

const MISSING_CONFIG = 'Falta configurar la base de datos: completa mobile/src/config.local.ts con la URL y la clave pública de Supabase.';
// http solo sirve para probar contra un Supabase local; el real siempre es https.
const isConfigured = () => /^https?:\/\//.test(SUPABASE_URL) && !SUPABASE_URL.includes('TU-PROYECTO') && SUPABASE_ANON_KEY.length > 20;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  if (!isConfigured()) throw new Error(MISSING_CONFIG);
  const created = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  // En segundo plano el sistema congela la app: la renovación del token se pausa y se retoma al volver.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') created.auth.startAutoRefresh();
    else created.auth.stopAutoRefresh();
  });
  client = created;
  return created;
}
