import { useCallback, useEffect, useState } from 'react';
import type { DataAccess } from './dataAccess';
import type { Business } from './types';

const NO_BUSINESS = 'Sin los datos del negocio no se puede imprimir.';

/** Datos del negocio para el encabezado del comprobante. `null` mientras cargan. */
export function useBusiness(data: Pick<DataAccess, 'loadBusiness' | 'businessRepository'>) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    data.loadBusiness()
      .then(({ data }) => setBusiness(data))
      .catch((err) => setError(err instanceof Error ? `${err.message} ${NO_BUSINESS}` : `No se cargaron los datos del negocio. ${NO_BUSINESS}`));
  }, [data]);

  const save = useCallback(async (input: Business) => {
    const saved = await data.businessRepository().update(input);
    setBusiness(saved);
    return saved;
  }, [data]);

  return { business, error, save };
}
