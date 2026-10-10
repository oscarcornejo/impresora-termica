import { useCallback, useEffect, useState } from 'react';
import { businessRepository } from './storage';
import type { Business } from './types';

/** Datos del negocio para el encabezado del comprobante. `null` mientras cargan. */
export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve()
      .then(() => businessRepository().get())
      .then(setBusiness)
      // Sin estos datos no se puede armar el comprobante: el aviso dice la consecuencia y cómo reintentar.
      .catch((err) =>
        setError(err instanceof Error ? `${err.message} Sin los datos del negocio no se puede imprimir.` : 'No se cargaron los datos del negocio, así que todavía no se puede imprimir. Recarga la página para reintentar.'),
      );
  }, []);

  const save = useCallback(async (input: Business) => {
    const saved = await businessRepository().update(input);
    setBusiness(saved);
    return saved;
  }, []);

  return { business, error, save };
}
