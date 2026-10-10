import { describe, expect, test } from 'vitest';
import { createBlock, moveBlock, removeBlock, updateBlock, twoColumns, sampleReceipt, withTearLine } from './blocks';

describe('operaciones de bloques (inmutables)', () => {
  const blocks = [createBlock('text', { text: 'a' }), createBlock('separator'), createBlock('feed')];

  test('updateBlock devuelve un arreglo nuevo sin mutar el original', () => {
    const next = updateBlock(blocks, blocks[0].id, { text: 'b' });
    expect(next[0]).toMatchObject({ text: 'b' });
    expect(blocks[0]).toMatchObject({ text: 'a' });
    expect(next[1]).toBe(blocks[1]);
  });

  test('moveBlock intercambia y respeta los bordes', () => {
    expect(moveBlock(blocks, blocks[0].id, 1).map((b) => b.type)).toEqual(['separator', 'text', 'feed']);
    expect(moveBlock(blocks, blocks[0].id, -1)).toBe(blocks);
  });

  test('removeBlock elimina por id', () => {
    expect(removeBlock(blocks, blocks[1].id)).toHaveLength(2);
  });

  test('cada bloque recibe un id único', () => {
    expect(new Set(blocks.map((b) => b.id)).size).toBe(3);
  });
});

test('twoColumns ajusta al ancho del papel', () => {
  expect(twoColumns('Café', '$100', 12)).toBe('Café    $100');
  expect(twoColumns('Muy largo texto', '$1', 10)).toBe('Muy largo texto $1');
});

test('sampleReceipt usa el ancho del papel en las líneas de dos columnas', () => {
  const total = sampleReceipt(32).find((b) => b.type === 'text' && b.text.startsWith('TOTAL'));
  expect(total && total.type === 'text' && total.text.length).toBe(32);
});

test('withTearLine agrega la línea con ✂ al final sin mutar y cabe en 32 caracteres', () => {
  const blocks = [createBlock('text', { text: 'hola' })];
  const result = withTearLine(blocks);
  expect(blocks).toHaveLength(1);
  const tear = result[result.length - 1];
  expect(tear.type === 'text' && tear.text.includes('✂')).toBe(true);
  expect(tear.type === 'text' && Array.from(tear.text).length).toBeLessThanOrEqual(32);
});
