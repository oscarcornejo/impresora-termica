// Acceso a datos de la web: Supabase para los datos, localStorage para la copia sin conexión.
import { createDataAccess } from '../dataAccess';
import { getSupabase } from '../supabase/client';
import { browserStorage } from './browserStorage';

export const webData = createDataAccess({ getDb: getSupabase, storage: browserStorage });
