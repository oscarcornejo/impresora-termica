// Búsqueda del catálogo en memoria: sirve igual con conexión y con la copia guardada.
import type { Product } from './types';

// Sin mayúsculas ni tildes: "cafe" encuentra "Café".
const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const sortByName = (products: readonly Product[]) =>
  [...products].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

export function searchProducts(products: readonly Product[], search: string): Product[] {
  const term = fold(search.trim());
  if (!term) return sortByName(products);
  return sortByName(products.filter((p) => fold(p.name).includes(term) || fold(p.code ?? '').includes(term)));
}
