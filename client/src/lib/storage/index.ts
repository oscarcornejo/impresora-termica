// Repositorios de la app: Supabase para los datos, el navegador para la copia sin conexión.
import { z } from 'zod';
import { getSupabase } from '../supabase/client';
import { createSupabaseBusinessRepository } from '../supabase/business';
import { createSupabaseProductRepository } from '../supabase/products';
import { businessSchema, storedProductSchema } from './schemas';
import { BUSINESS_CACHE_KEY, CATALOG_CACHE_KEY, loadWithCache } from './cache';
import { browserStorage } from './store';

export const productRepository = () => createSupabaseProductRepository(getSupabase());
export const businessRepository = () => createSupabaseBusinessRepository(getSupabase());

export const loadCatalog = () =>
  loadWithCache({
    storage: browserStorage(),
    key: CATALOG_CACHE_KEY,
    schema: z.array(storedProductSchema),
    load: () => productRepository().findAll(),
  });

export const loadBusiness = () =>
  loadWithCache({ storage: browserStorage(), key: BUSINESS_CACHE_KEY, schema: businessSchema, load: () => businessRepository().get() });
