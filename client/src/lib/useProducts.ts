import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadCatalog, productRepository } from './storage';
import { searchProducts } from './productSearch';
import type { Product, ProductInput } from './types';

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Error inesperado');

/** Catálogo desde la base (o la copia del dispositivo sin conexión), con búsqueda en memoria. */
export function useProducts() {
  const [all, setAll] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    loadCatalog()
      .then(({ data, isOffline: offline }) => {
        if (isCancelled) return;
        setAll(data);
        setIsOffline(offline);
        setError(null);
      })
      .catch((err) => !isCancelled && setError(errorMessage(err)))
      .finally(() => !isCancelled && setIsLoading(false));
    return () => {
      isCancelled = true;
    };
  }, [version]);

  const products = useMemo(() => searchProducts(all, search), [all, search]);
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

  return { products, search, setSearch, isLoading, isOffline, error, save, remove };
}
