// Filas de Postgres (snake_case) a objetos de la app, validando lo que llega de la red.
import { z } from 'zod';
import type { Business, Product } from '../types';

const productRow = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  price: z.number().int().min(0),
  code: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const businessRow = z.object({ name: z.string(), address: z.string(), phone: z.string(), footer: z.string() });

export function toProduct(row: unknown): Product {
  const r = productRow.parse(row);
  return { id: r.id, name: r.name, price: r.price, code: r.code, createdAt: r.created_at, updatedAt: r.updated_at };
}

export const toBusiness = (row: unknown): Business => businessRow.parse(row);
