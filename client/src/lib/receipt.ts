// Arma el comprobante (bloques del editor) a partir del carrito y los datos del negocio.
import { createBlock, twoColumns } from './blocks';
import { cartTotal, lineTotal } from './cart';
import { formatPrice } from './money';
import type { Business, CartLine, EditorBlock } from './types';

// Un punto y no '…': la tabla de caracteres de las impresoras ESC/POS (PC850) no tiene '…'.
const TRUNCATION_MARK = '.';

// 24 h y sin "a. m.": Intl usa espacios especiales (U+202F) que la impresora no puede imprimir.
const DATE_FORMAT = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** 9 oct 2026 00:37 → "09-10-2026 00:37" (solo caracteres ASCII). */
export function formatReceiptDate(date: Date): string {
  return DATE_FORMAT.format(date).replace(',', '').replace(/\s+/g, ' ');
}

/** Recorta `text` para que quepa en `max` caracteres: "Sándwich de pollo" → "Sándwich." */
export function fitText(text: string, max: number): string {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  return chars.slice(0, Math.max(0, max - 1)).join('').trimEnd() + TRUNCATION_MARK;
}

/** "2 x Café            $5.000": el nombre se recorta para no empujar el precio a otra línea. */
export function itemLine(line: CartLine, chars: number): string {
  const price = formatPrice(lineTotal(line));
  const left = fitText(`${line.quantity} x ${line.name}`, chars - price.length - 1);
  return twoColumns(left, price, chars);
}

/**
 * Lo impreso es un comprobante interno, no una boleta del SII: el papel lo dice.
 * Solo ASCII (cabe en PC850) y 32 caracteres, una línea exacta en papel de 58 mm.
 */
export const RECEIPT_LEGEND = 'Comprobante sin valor tributario';

interface SaleReceiptInput {
  business: Business;
  lines: CartLine[];
  chars: number;
  date?: Date;
}

export function buildSaleReceipt({ business, lines, chars, date = new Date() }: SaleReceiptInput): EditorBlock[] {
  const contact = [business.address, business.phone].filter(Boolean).join('\n');
  return [
    createBlock('text', { text: business.name, align: 'center', bold: true, size: 2 }),
    ...(contact ? [createBlock('text', { text: contact, align: 'center' })] : []),
    createBlock('separator'),
    createBlock('text', { text: formatReceiptDate(date) }),
    createBlock('separator'),
    createBlock('text', { text: lines.map((line) => itemLine(line, chars)).join('\n') }),
    createBlock('separator'),
    createBlock('text', { text: twoColumns('TOTAL', formatPrice(cartTotal(lines)), chars), bold: true }),
    createBlock('feed', { lines: 1 }),
    createBlock('text', { text: RECEIPT_LEGEND, align: 'center' }),
    ...(business.footer
      ? [createBlock('text', { text: business.footer, align: 'center' })]
      : []),
  ];
}
