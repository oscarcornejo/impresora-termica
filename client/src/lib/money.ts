const PRICE_FORMAT = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

/** 5000 → "$5.000" */
export function formatPrice(value: number): string {
  return PRICE_FORMAT.format(value);
}

/** Lee lo que escribe el usuario ("5.000", "$ 5000") y devuelve el entero, o null si no es válido. */
export function parsePrice(input: string): number | null {
  const digits = input.replace(/[$\s.]/g, '');
  if (!/^\d{1,9}$/.test(digits)) return null;
  return Number(digits);
}
