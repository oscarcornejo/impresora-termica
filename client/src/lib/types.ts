export type Align = 'left' | 'center' | 'right';
export type PaperWidth = 58 | 80;
/** escpos: la mayoría de impresoras. cat: YT01/GB01/MX05… (solo imprimen imágenes). */
export type PrinterProtocol = 'escpos' | 'cat';
/** Intensidad de impresión de las impresoras "cat". */
export type Darkness = 'normal' | 'dark' | 'max';

export interface TextBlock {
  type: 'text';
  text: string;
  align: Align;
  bold: boolean;
  underline: boolean;
  size: 1 | 2 | 3 | 4;
}
export interface SeparatorBlock {
  type: 'separator';
}
export interface QrBlock {
  type: 'qr';
  data: string;
  align: Align;
  moduleSize: number;
}
export interface ImageBlock {
  type: 'image';
  width: number;
  height: number;
  /** Bits 1-bpp empaquetados por fila, en base64. */
  data: string;
  align: Align;
  /** Solo para la vista previa; no se imprime. */
  previewUrl?: string;
}
export interface FeedBlock {
  type: 'feed';
  lines: number;
}

export type Block = TextBlock | SeparatorBlock | QrBlock | ImageBlock | FeedBlock;
export type BlockType = Block['type'];

/** Bloque con id estable para las keys de React. */
export type EditorBlock = Block & { id: string };

export interface PrintDocument {
  protocol?: PrinterProtocol;
  darkness?: Darkness;
  paperWidth: PaperWidth;
  cut: boolean;
  blocks: Block[];
}

export interface PrinterStatus {
  connected: boolean;
  transport: 'ble' | null;
  id: string | null;
}

export const PAPER_DOTS: Record<PaperWidth, number> = { 58: 384, 80: 576 };
export const PAPER_CHARS: Record<PaperWidth, number> = { 58: 32, 80: 48 };

export interface Product {
  id: number;
  name: string;
  /** Pesos chilenos, sin decimales. */
  price: number;
  code: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Pick<Product, 'name' | 'price' | 'code'>;

export interface Business {
  name: string;
  address: string;
  phone: string;
  footer: string;
}

export interface CartLine {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}
