// Productos guardados en el dispositivo (localStorage). Cada operación devuelve datos nuevos.
import { z } from 'zod';
import type { Product, ProductInput } from '../types';
import { parseOrThrow, productInputSchema, storedProductSchema } from './schemas';
import { readJson, writeJson } from './store';

export const PRODUCTS_KEY = 'impresora-termica:products:v1';
const MAX_RESULTS = 500;
const DUPLICATE_CODE = 'Ya existe un producto con ese código';
const NOT_FOUND = 'Producto no encontrado';

const stateSchema = z.object({ nextId: z.number().int().positive(), items: z.array(storedProductSchema) });
type State = z.infer<typeof stateSchema>;
const EMPTY: State = { nextId: 1, items: [] };

export interface ProductRepository {
  findAll(query?: { search?: string }): Promise<Product[]>;
  create(input: ProductInput): Promise<Product>;
  update(id: number, input: ProductInput): Promise<Product>;
  remove(id: number): Promise<void>;
}

// Sin mayúsculas ni tildes: "cafe" encuentra "Café".
const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const byName = (a: Product, b: Product) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

export function createProductRepository(storage: Storage, now: () => string = () => new Date().toISOString()): ProductRepository {
  const read = () => readJson(storage, PRODUCTS_KEY, stateSchema, EMPTY);
  const write = (state: State) => writeJson(storage, PRODUCTS_KEY, state);

  const assertUniqueCode = (items: Product[], code: string | null, exceptId?: number) => {
    if (code && items.some((p) => p.code === code && p.id !== exceptId)) throw new Error(DUPLICATE_CODE);
  };

  return {
    async findAll({ search } = {}) {
      const term = fold(search?.trim() ?? '');
      const matches = term
        ? read().items.filter((p) => fold(p.name).includes(term) || fold(p.code ?? '').includes(term))
        : read().items;
      return [...matches].sort(byName).slice(0, MAX_RESULTS);
    },

    async create(input) {
      const data = parseOrThrow(productInputSchema, input);
      const state = read();
      assertUniqueCode(state.items, data.code);
      const timestamp = now();
      const product: Product = { id: state.nextId, ...data, createdAt: timestamp, updatedAt: timestamp };
      write({ nextId: state.nextId + 1, items: [...state.items, product] });
      return product;
    },

    async update(id, input) {
      const data = parseOrThrow(productInputSchema, input);
      const state = read();
      const current = state.items.find((p) => p.id === id);
      if (!current) throw new Error(NOT_FOUND);
      assertUniqueCode(state.items, data.code, id);
      const updated: Product = { ...current, ...data, updatedAt: now() };
      write({ ...state, items: state.items.map((p) => (p.id === id ? updated : p)) });
      return updated;
    },

    async remove(id) {
      const state = read();
      if (!state.items.some((p) => p.id === id)) throw new Error(NOT_FOUND);
      write({ ...state, items: state.items.filter((p) => p.id !== id) });
    },
  };
}
