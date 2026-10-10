import { describe, expect, test } from 'vitest';
import { createProductRepository, PRODUCTS_KEY } from './products';
import { createMemoryStorage } from './memoryStorage';

const setup = (initial?: Record<string, string>) => createProductRepository(createMemoryStorage(initial));

describe('productos guardados en el dispositivo', () => {
  test('crea con id incremental y los lista ordenados por nombre', async () => {
    const repo = setup();
    const b = await repo.create({ name: 'Panchito', price: 1500, code: 'PAN' });
    const a = await repo.create({ name: 'chicle', price: 100, code: null });
    expect([a.id, b.id]).toEqual([2, 1]);
    expect((await repo.findAll()).map((p) => p.name)).toEqual(['chicle', 'Panchito']);
  });

  test('busca por nombre o código sin importar mayúsculas ni tildes', async () => {
    const repo = setup();
    await repo.create({ name: 'Café americano', price: 2500, code: 'CAF' });
    await repo.create({ name: 'Jugo', price: 3200, code: 'JG-1' });
    expect((await repo.findAll({ search: 'cafe' })).map((p) => p.name)).toEqual(['Café americano']);
    expect((await repo.findAll({ search: 'jg-' })).map((p) => p.name)).toEqual(['Jugo']);
    expect(await repo.findAll({ search: 'té' })).toEqual([]);
  });

  test('valida la entrada: nombre obligatorio y precio entero', async () => {
    const repo = setup();
    await expect(repo.create({ name: '  ', price: 100, code: null })).rejects.toThrow('El nombre es obligatorio');
    await expect(repo.create({ name: 'Té', price: 10.5, code: null })).rejects.toThrow('entero');
  });

  test('normaliza: recorta espacios y guarda código vacío como null', async () => {
    const created = await setup().create({ name: '  Té  ', price: 900, code: '   ' });
    expect(created).toMatchObject({ name: 'Té', price: 900, code: null });
  });

  test('rechaza un código repetido, también al editar', async () => {
    const repo = setup();
    await repo.create({ name: 'Uno', price: 1, code: 'X1' });
    const dos = await repo.create({ name: 'Dos', price: 2, code: null });
    await expect(repo.create({ name: 'Otro', price: 3, code: 'X1' })).rejects.toThrow('Ya existe un producto con ese código');
    await expect(repo.update(dos.id, { name: 'Dos', price: 2, code: 'X1' })).rejects.toThrow('Ya existe');
  });

  test('editar conserva el id y la fecha de creación; editar o borrar uno inexistente falla', async () => {
    const repo = setup();
    const p = await repo.create({ name: 'Té', price: 900, code: null });
    const edited = await repo.update(p.id, { name: 'Té verde', price: 1000, code: null });
    expect(edited).toMatchObject({ id: p.id, name: 'Té verde', createdAt: p.createdAt });
    await expect(repo.update(99, { name: 'X', price: 1, code: null })).rejects.toThrow('Producto no encontrado');
    await repo.remove(p.id);
    expect(await repo.findAll()).toEqual([]);
    await expect(repo.remove(p.id)).rejects.toThrow('Producto no encontrado');
  });

  test('los ids no se reutilizan después de borrar', async () => {
    const repo = setup();
    const a = await repo.create({ name: 'A', price: 1, code: null });
    await repo.remove(a.id);
    expect((await repo.create({ name: 'B', price: 1, code: null })).id).toBe(a.id + 1);
  });

  test('datos guardados dañados: avisa sin borrarlos', async () => {
    const storage = createMemoryStorage({ [PRODUCTS_KEY]: '{"nextId":"x"' });
    const repo = createProductRepository(storage);
    await expect(repo.findAll()).rejects.toThrow('dañados');
    expect(storage.getItem(PRODUCTS_KEY)).toBe('{"nextId":"x"');
  });
});
