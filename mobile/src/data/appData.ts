// Acceso a datos de la app: el mismo de la web, con el almacenamiento y la red del teléfono.
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createDataAccess, type DataAccess } from '@core/dataAccess';
import { BUSINESS_CACHE_KEY, CATALOG_CACHE_KEY } from '@core/storage/cache';
import { setOfflineCheck } from '@core/supabase/query';
import { createPersistentStorage } from './persistentStorage';
import { getSupabase } from './supabase';

let isOffline = false;

// Sin señal se usa la copia guardada al instante, en vez de esperar los reintentos de Supabase.
function watchConnectivity() {
  NetInfo.addEventListener((state) => {
    isOffline = state.isConnected === false;
  });
  setOfflineCheck(() => isOffline);
}

export async function createAppData(): Promise<DataAccess> {
  watchConnectivity();
  const storage = await createPersistentStorage(AsyncStorage, [CATALOG_CACHE_KEY, BUSINESS_CACHE_KEY]);
  return createDataAccess({ getDb: getSupabase, storage: () => storage });
}
