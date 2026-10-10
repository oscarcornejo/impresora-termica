import { useState } from 'react';

const COPIED_MS = 2500;

/** Copia la dirección de la app para pegarla en otro navegador (Bluefy). */
export function CopyLinkButton() {
  const [label, setLabel] = useState('Copiar dirección');

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setLabel('Dirección copiada');
    } catch {
      // Sin permiso de portapapeles: se muestra la dirección para copiarla a mano.
      setLabel(window.location.host);
    }
    setTimeout(() => setLabel('Copiar dirección'), COPIED_MS);
  }

  return (
    <button type="button" className="secondary" onClick={copy} aria-live="polite">
      {label}
    </button>
  );
}
