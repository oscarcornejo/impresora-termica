// Productos en Supabase (tabla `products`).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product, ProductInput } from '../types';
import { parseOrThrow, productInputSchema } from '../storage/schemas';
import { query } from './query';
import { toProduct } from './rows';

const MAX_RESULTS = 500;
const NOT_FOUND = 'Producto no encontrado. Puede que otra persona lo haya borrado; recarga la lista.';
const COLUMNS = 'id, name, price, code, created_at, updated_at';

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  create(input: ProductInput): Promise<Product>;
  update(id: number, input: ProductInput): Promise<Product>;
  remove(id: number): Promise<void>;
}

export function createSupabaseProductRepository(db: SupabaseClient): ProductRepository {
  const table = () => db.from('products');

  return {
    async findAll() {
      const rows = await query(() => table().select(COLUMNS).order('name').limit(MAX_RESULTS));
      return (rows ?? []).map(toProduct);
    },

    async create(input) {
      const data = parseOrThrow(productInputSchema, input);
      return toProduct(await query(() => table().insert(data).select(COLUMNS).single()));
    },

    async update(id, input) {
      const data = parseOrThrow(productInputSchema, input);
      const row = await query(() => table().update(data).eq('id', id).select(COLUMNS).maybeSingle());
      if (!row) throw new Error(NOT_FOUND);
      return toProduct(row);
    },

    async remove(id) {
      const rows = await query(() => table().delete().eq('id', id).select('id'));
      if (!rows?.length) throw new Error(NOT_FOUND);
    },
  };
}
