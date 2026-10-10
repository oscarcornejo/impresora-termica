import { z } from 'zod';

const MAX_TEXT_LENGTH = 5000;
const MAX_QR_LENGTH = 700;
const MAX_IMAGE_WIDTH = 576;
const MAX_IMAGE_HEIGHT = 4000;
const MAX_BLOCKS = 100;

const alignSchema = z.enum(['left', 'center', 'right']).default('left');

const textBlock = z.object({
  type: z.literal('text'),
  text: z.string().max(MAX_TEXT_LENGTH),
  align: alignSchema,
  bold: z.boolean().default(false),
  underline: z.boolean().default(false),
  size: z.number().int().min(1).max(4).default(1),
});

const separatorBlock = z.object({ type: z.literal('separator') });

const qrBlock = z.object({
  type: z.literal('qr'),
  data: z.string().min(1).max(MAX_QR_LENGTH),
  align: alignSchema,
  moduleSize: z.number().int().min(1).max(16).default(6),
});

const imageBlock = z
  .object({
    type: z.literal('image'),
    width: z.number().int().min(8).max(MAX_IMAGE_WIDTH),
    height: z.number().int().min(1).max(MAX_IMAGE_HEIGHT),
    data: z.string().base64(),
    align: alignSchema,
  })
  .refine(
    (img) => Buffer.from(img.data, 'base64').length === Math.ceil(img.width / 8) * img.height,
    { message: 'El tamaño de los datos de la imagen no coincide con width/height' },
  );

const feedBlock = z.object({
  type: z.literal('feed'),
  lines: z.number().int().min(1).max(20).default(1),
});

export const documentSchema = z.object({
  // escpos: la mayoría de impresoras. cat: YT01/GB01/MX05… (solo imágenes, 384 puntos).
  protocol: z.enum(['escpos', 'cat']).default('escpos'),
  // Solo protocolo cat: intensidad de impresión.
  darkness: z.enum(['normal', 'dark', 'max']).default('max'),
  paperWidth: z.union([z.literal(58), z.literal(80)]).default(58),
  cut: z.boolean().default(false),
  blocks: z
    .array(z.union([textBlock, separatorBlock, qrBlock, imageBlock, feedBlock]))
    .min(1, 'El documento está vacío')
    .max(MAX_BLOCKS),
});

export const connectSchema = z.object({
  transport: z.enum(['serial', 'ble']),
  id: z.string().min(1).max(256),
});

const MAX_PRICE = 100_000_000;

// Campo de texto opcional: "" o solo espacios se guarda como null.
const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const productSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
  price: z.number().int('El precio debe ser un número entero').min(0).max(MAX_PRICE),
  code: optionalText(40),
});

export const productIdSchema = z.coerce.number().int().positive();

export const productQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
});

export const businessSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del negocio es obligatorio').max(48),
  address: z.string().trim().max(200).default(''),
  phone: z.string().trim().max(40).default(''),
  footer: z.string().trim().max(200).default(''),
});
