// Los mismos tokens de la web: neutros cálidos de papel térmico y un solo acento rojo para la acción principal.
// Siempre claro: se usa al aire libre, y con sol la pantalla clara con tinta oscura es la que se lee.

export const colors = {
  bg: '#ece7de',
  surface: '#fbfaf7',
  surface2: '#f1ece3',
  tile: '#ffffff',
  ink: '#17150f',
  inkSoft: '#514c43',
  line: '#d9d1c3',
  lineStrong: '#8a8174',
  accent: '#b3341d',
  accentPressed: '#992a16',
  accentInk: '#ffffff',
  ok: '#1f6b3f',
  warnBg: '#fbeadb',
  warnInk: '#7a3f0a',
  disabledBg: '#e3ddd2',
  disabledInk: '#4f4a42',
  placeholder: '#6a645a',
} as const;

/** Tamaños por rol. Nada que haya que leer baja de 14: la app se usa de pie y al sol. */
export const text = {
  label: 13,
  meta: 14,
  body: 16,
  title: 17,
  amount: 26,
} as const;

export const radius = { s: 6, m: 10, l: 14 } as const;

/** Alto mínimo de lo que se toca (guía de Apple). */
export const MIN_TOUCH = 44;

export const space = (steps: number) => steps * 4;
