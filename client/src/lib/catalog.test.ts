import { describe, expect, test } from 'vitest';
import { catalogDensity } from './catalog';

describe('densidad del catálogo', () => {
  test('con pocos productos las tarjetas son grandes', () => {
    expect(catalogDensity(1)).toBe('roomy');
    expect(catalogDensity(4)).toBe('roomy');
  });

  test('con una cantidad media son algo más grandes', () => {
    expect(catalogDensity(5)).toBe('comfortable');
    expect(catalogDensity(9)).toBe('comfortable');
  });

  test('con muchos productos vuelven al tamaño compacto', () => {
    expect(catalogDensity(10)).toBe('compact');
    expect(catalogDensity(500)).toBe('compact');
  });
});
