import { describe, expect, test } from 'vitest';
import { nextRadioIndex } from './radioGroup';

const none = () => false;

describe('teclado en grupos de opciones', () => {
  test('las flechas avanzan y retroceden, dando la vuelta en los extremos', () => {
    expect(nextRadioIndex(3, 0, 'ArrowRight', none)).toBe(1);
    expect(nextRadioIndex(3, 2, 'ArrowRight', none)).toBe(0);
    expect(nextRadioIndex(3, 0, 'ArrowLeft', none)).toBe(2);
    expect(nextRadioIndex(3, 1, 'ArrowDown', none)).toBe(2);
    expect(nextRadioIndex(3, 1, 'ArrowUp', none)).toBe(0);
  });

  test('Inicio y Fin van a la primera y la última opción', () => {
    expect(nextRadioIndex(3, 1, 'Home', none)).toBe(0);
    expect(nextRadioIndex(3, 1, 'End', none)).toBe(2);
  });

  test('salta las opciones desactivadas', () => {
    const onlyMiddleDisabled = (i: number) => i === 1;
    expect(nextRadioIndex(3, 0, 'ArrowRight', onlyMiddleDisabled)).toBe(2);
    expect(nextRadioIndex(3, 2, 'ArrowLeft', onlyMiddleDisabled)).toBe(0);
    expect(nextRadioIndex(2, 0, 'End', (i) => i === 1)).toBe(0);
  });

  test('otras teclas no mueven la selección', () => {
    expect(nextRadioIndex(3, 1, 'Tab', none)).toBeNull();
    expect(nextRadioIndex(3, 1, 'a', none)).toBeNull();
  });

  test('si todas las demás están desactivadas, se queda donde está', () => {
    expect(nextRadioIndex(3, 0, 'ArrowRight', (i) => i !== 0)).toBe(0);
  });
});
