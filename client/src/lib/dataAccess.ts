// Repositorios de la app armados con el cliente de Supabase y el almacenamiento de cada plataforma
// (navegador o iPhone). Supabase guarda los datos; el almacenamiento, la copia para vender sin conexión.
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBusinessRepository, type BusinessRepository } from './supabase/business';
import { createSupabaseProductRepository, type ProductRepository } from './supabase/products';
import { businessSchema, storedProductSchema } from './storage/schemas';
import type { SyncStorage } from './storage/store';
import { BUSINESS_CACHE_KEY, CATALOG_CACHE_KEY, loadWithCache, type Loaded } from './storage/cache';
import type { Business, Product } from './types';

interface DataAccessDeps {
  getDb: () => SupabaseClient;
  /** Almacenamiento síncrono con la interfaz de localStorage. */
  storage: () => SyncStorage;
}

export interface DataAccess extends DataAccessDeps {
  productRepository: () => ProductRepository;
  businessRepository: () => BusinessRepository;
  loadCatalog: () => Promise<Loaded<Product[]>>;
  loadBusiness: () => Promise<Loaded<Business>>;
}

export function createDataAccess({ getDb, storage }: DataAccessDeps): DataAccess {
  const productRepository = () => createSupabaseProductRepository(getDb());
  const businessRepository = () => createSupabaseBusinessRepository(getDb());
  return {
    getDb,
    storage,
    productRepository,
    businessRepository,
    loadCatalog: () =>
      loadWithCache({ storage: storage(), key: CATALOG_CACHE_KEY, schema: z.array(storedProductSchema), load: () => productRepository().findAll() }),
    loadBusiness: () =>
      loadWithCache({ storage: storage(), key: BUSINESS_CACHE_KEY, schema: businessSchema, load: () => businessRepository().get() }),
  };
}
