// Navegación con teclado de un grupo de opciones (patrón "radio group" de WAI-ARIA).

const STEP_BY_KEY: Record<string, 1 | -1> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Busca la primera opción activa desde `start` avanzando de a `step`; `null` si no hay ninguna. */
function findEnabled(count: number, start: number, step: 1 | -1, isDisabled: (index: number) => boolean): number | null {
  for (let offset = 0; offset < count; offset += 1) {
    const index = (((start + offset * step) % count) + count) % count;
    if (!isDisabled(index)) return index;
  }
  return null;
}

/**
 * Opción a seleccionar al presionar `key` estando en `current`.
 * Flechas: siguiente/anterior (dando la vuelta). Inicio/Fin: primera/última. Salta las desactivadas.
 * Devuelve `null` si la tecla no corresponde al grupo (para dejar pasar Tab y el resto).
 */
export function nextRadioIndex(
  count: number,
  current: number,
  key: string,
  isDisabled: (index: number) => boolean,
): number | null {
  if (key === 'Home') return findEnabled(count, 0, 1, isDisabled) ?? current;
  if (key === 'End') return findEnabled(count, count - 1, -1, isDisabled) ?? current;
  const step = STEP_BY_KEY[key];
  if (!step) return null;
  return findEnabled(count, current + step, step, isDisabled) ?? current;
}
