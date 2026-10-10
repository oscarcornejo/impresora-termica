import { createPersistentStorage, type AsyncBackend } from '../src/data/persistentStorage';

function fakeBackend(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const backend: AsyncBackend = {
    getMany: async (keys) => Object.fromEntries(keys.map((k) => [k, data.get(k) ?? null])),
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
  return { backend, data };
}

describe('almacenamiento del teléfono para la copia sin conexión', () => {
  test('al abrir carga lo guardado y lo entrega al instante', async () => {
    const { backend } = fakeBackend({ catalog: '[1]' });
    const storage = await createPersistentStorage(backend, ['catalog', 'business']);
    expect(storage.getItem('catalog')).toBe('[1]');
    expect(storage.getItem('business')).toBeNull();
  });

  test('lo que se escribe se lee enseguida y queda guardado en el teléfono', async () => {
    const { backend, data } = fakeBackend();
    const storage = await createPersistentStorage(backend, ['catalog']);
    storage.setItem('catalog', '[2]');
    expect(storage.getItem('catalog')).toBe('[2]');
    await Promise.resolve();
    expect(data.get('catalog')).toBe('[2]');
  });

  test('borrar también borra lo guardado', async () => {
    const { backend, data } = fakeBackend({ catalog: '[1]' });
    const storage = await createPersistentStorage(backend, ['catalog']);
    storage.removeItem('catalog');
    await Promise.resolve();
    expect(storage.getItem('catalog')).toBeNull();
    expect(data.has('catalog')).toBe(false);
  });

  test('si el teléfono no deja leer, arranca vacío en vez de fallar', async () => {
    const backend: AsyncBackend = {
      getMany: async () => {
        throw new Error('disco');
      },
      setItem: async () => {},
      removeItem: async () => {},
    };
    const storage = await createPersistentStorage(backend, ['catalog']);
    expect(storage.getItem('catalog')).toBeNull();
  });
});
