import { useCallback, useEffect, useState } from 'react';
import { productRepository } from './storage';
import type { Product, ProductInput } from './types';

const SEARCH_DEBOUNCE_MS = 200;

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Error inesperado');

/** Lista de productos con búsqueda; `save` y `remove` recargan la lista al terminar. */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    const timer = setTimeout(() => {
      Promise.resolve()
        .then(() => productRepository().findAll({ search: search.trim() }))
        .then((list) => {
          if (isCancelled) return;
          setProducts(list);
          setError(null);
        })
        .catch((err) => !isCancelled && setError(errorMessage(err)))
        .finally(() => !isCancelled && setIsLoading(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [search, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Lanzan el error para que el formulario lo muestre junto al campo.
  const save = useCallback(
    async (input: ProductInput, id?: number) => {
      const repo = productRepository();
      const product = id ? await repo.update(id, input) : await repo.create(input);
      reload();
      return product;
    },
    [reload],
  );

  const remove = useCallback(
    async (id: number) => {
      await productRepository().remove(id);
      reload();
    },
    [reload],
  );

  return { products, search, setSearch, isLoading, error, save, remove };
}
