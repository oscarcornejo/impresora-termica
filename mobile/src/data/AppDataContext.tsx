import { createContext, useContext, type ReactNode } from 'react';
import type { DataAccess } from '@core/dataAccess';

const AppDataContext = createContext<DataAccess | null>(null);

export function AppDataProvider({ data, children }: { data: DataAccess; children: ReactNode }) {
  return <AppDataContext.Provider value={data}>{children}</AppDataContext.Provider>;
}

export function useAppData(): DataAccess {
  const data = useContext(AppDataContext);
  if (!data) throw new Error('useAppData necesita AppDataProvider');
  return data;
}
