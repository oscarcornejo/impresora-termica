// Datos del negocio en Supabase (tabla `business`, una sola fila con id = 1).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Business } from '../types';
import { businessSchema, parseOrThrow } from '../storage/schemas';
import { query } from './query';
import { toBusiness } from './rows';

const BUSINESS_ID = 1;
const COLUMNS = 'name, address, phone, footer';
const NO_ROW = 'No se encontraron los datos del negocio en la base. Revisa que se haya ejecutado el script de Supabase y que la cuenta esté autorizada.';

export interface BusinessRepository {
  get(): Promise<Business>;
  update(input: Business): Promise<Business>;
}

export function createSupabaseBusinessRepository(db: SupabaseClient): BusinessRepository {
  const table = () => db.from('business');

  return {
    async get() {
      const row = await query(() => table().select(COLUMNS).eq('id', BUSINESS_ID).maybeSingle());
      if (!row) throw new Error(NO_ROW);
      return toBusiness(row);
    },
    async update(input) {
      const data = parseOrThrow(businessSchema, input);
      const row = await query(() => table().update(data).eq('id', BUSINESS_ID).select(COLUMNS).maybeSingle());
      if (!row) throw new Error(NO_ROW);
      return toBusiness(row);
    },
  };
}
