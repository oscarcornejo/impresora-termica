import { describe, expect, test } from 'vitest';
import { BUSINESS_KEY, DEFAULT_BUSINESS, createBusinessRepository } from './business';
import { createMemoryStorage } from './memoryStorage';

describe('datos del negocio guardados en el dispositivo', () => {
  test('sin datos guardados devuelve los valores por defecto', async () => {
    expect(await createBusinessRepository(createMemoryStorage()).get()).toEqual(DEFAULT_BUSINESS);
  });

  test('guarda recortando espacios y los devuelve', async () => {
    const storage = createMemoryStorage();
    const repo = createBusinessRepository(storage);
    const saved = await repo.update({ name: ' La Feria ', address: 'Av. 1', phone: '', footer: 'Gracias' });
    expect(saved.name).toBe('La Feria');
    expect(await createBusinessRepository(storage).get()).toEqual(saved);
  });

  test('el nombre es obligatorio', async () => {
    const repo = createBusinessRepository(createMemoryStorage());
    await expect(repo.update({ name: ' ', address: '', phone: '', footer: '' })).rejects.toThrow('obligatorio');
  });

  test('datos guardados dañados: avisa sin borrarlos', async () => {
    const storage = createMemoryStorage({ [BUSINESS_KEY]: '{"name":5}' });
    await expect(createBusinessRepository(storage).get()).rejects.toThrow('dañados');
    expect(storage.getItem(BUSINESS_KEY)).toBe('{"name":5}');
  });
});
