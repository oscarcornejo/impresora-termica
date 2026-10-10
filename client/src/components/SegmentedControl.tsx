import { useRef, type KeyboardEvent } from 'react';
import { nextRadioIndex } from '../lib/radioGroup';

export interface SegmentedOption<T> {
  value: T;
  label: string;
  isDisabled?: boolean;
}

interface SegmentedControlProps<T> {
  /** Nombre del grupo para el lector de pantalla. */
  label: string;
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Desactiva todo el grupo (por ejemplo, mientras la impresora está ocupada). */
  isDisabled?: boolean;
  isSmall?: boolean;
}

/**
 * Grupo de opciones excluyentes con el comportamiento que anuncia: un solo tope de Tab para todo el grupo,
 * flechas para cambiar de opción e Inicio/Fin, saltando las desactivadas.
 */
export function SegmentedControl<T extends string | number>({
  label, options, value, onChange, isDisabled = false, isSmall = false,
}: SegmentedControlProps<T>) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const isOptionDisabled = (index: number) => isDisabled || Boolean(options[index]?.isDisabled);
  const selected = options.findIndex((option) => option.value === value);
  // El tope de Tab es la opción elegida; si no se puede enfocar, la primera disponible.
  const tabStop = selected >= 0 && !isOptionDisabled(selected)
    ? selected
    : options.findIndex((_, index) => !isOptionDisabled(index));

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const from = selected >= 0 ? selected : Math.max(0, tabStop);
    const next = nextRadioIndex(options.length, from, event.key, isOptionDisabled);
    if (next === null) return;
    event.preventDefault();
    buttons.current[next]?.focus();
    if (next !== selected) onChange(options[next].value);
  }

  return (
    <div className={`segmented ${isSmall ? 'small' : ''}`} role="radiogroup" aria-label={label} onKeyDown={handleKeyDown}>
      {options.map((option, index) => (
        <button
          key={String(option.value)}
          ref={(element) => { buttons.current[index] = element; }}
          type="button"
          role="radio"
          aria-checked={index === selected}
          tabIndex={index === tabStop ? 0 : -1}
          disabled={isOptionDisabled(index)}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
