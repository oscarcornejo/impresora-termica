// Utilidades de bytes para armar lo que se envía a la impresora (en el navegador no hay Buffer).

export function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  parts.reduce((offset, part) => {
    out.set(part, offset);
    return offset + part.length;
  }, 0);
  return out;
}

export function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

/** Posición de `needle` dentro de `haystack`, o -1. */
export function indexOfBytes(haystack: Uint8Array, needle: Uint8Array): number {
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (needle.every((byte, j) => haystack[i + j] === byte)) return i;
  }
  return -1;
}

export const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.trunc(value)));
