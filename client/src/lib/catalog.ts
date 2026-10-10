// Tamaño de las tarjetas del catálogo según cuántos productos se muestran.

export type CatalogDensity = 'roomy' | 'comfortable' | 'compact';

/** Hasta este número de productos, tarjetas grandes: se tocan sin apuntar y no queda un catálogo perdido en el panel. */
const ROOMY_MAX = 4;
/** Hasta este número, tarjetas algo más grandes que las compactas. */
const COMFORTABLE_MAX = 9;

export function catalogDensity(count: number): CatalogDensity {
  if (count <= ROOMY_MAX) return 'roomy';
  if (count <= COMFORTABLE_MAX) return 'comfortable';
  return 'compact';
}
