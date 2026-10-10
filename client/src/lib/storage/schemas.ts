// Validación de lo que se guarda en el dispositivo (la misma que tenía el servidor).
import { z } from 'zod';

const MAX_PRICE = 100_000_000;

// Campo de texto opcional: "" o solo espacios se guarda como null.
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));

export const productInputSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
  price: z.number().int('El precio debe ser un número entero').min(0).max(MAX_PRICE),
  code: optionalText(40),
});

export const storedProductSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  price: z.number().int().min(0),
  code: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const businessSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del negocio es obligatorio').max(48),
  address: z.string().trim().max(200).default(''),
  phone: z.string().trim().max(40).default(''),
  footer: z.string().trim().max(200).default(''),
});

/** Valida o lanza un Error con el primer mensaje legible. */
export function parseOrThrow<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? 'Datos inválidos');
  return result.data;
}
