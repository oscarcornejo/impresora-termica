import { useCallback, useEffect, useState } from 'react';
import { businessRepository, loadBusiness } from './storage';
import type { Business } from './types';

const NO_BUSINESS = 'Sin los datos del negocio no se puede imprimir.';

/** Datos del negocio para el encabezado del comprobante. `null` mientras cargan. */
export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBusiness()
      .then(({ data }) => setBusiness(data))
      .catch((err) => setError(err instanceof Error ? `${err.message} ${NO_BUSINESS}` : `No se cargaron los datos del negocio. ${NO_BUSINESS}`));
  }, []);

  const save = useCallback(async (input: Business) => {
    const saved = await businessRepository().update(input);
    setBusiness(saved);
    return saved;
  }, []);

  return { business, error, save };
}
