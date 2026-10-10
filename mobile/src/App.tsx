import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { DataAccess } from '@core/dataAccess';
import { useAuth } from '@core/useAuth';
import { createAppData } from './data/appData';
import { AppDataProvider, useAppData } from './data/AppDataContext';
import { MainScreen } from './MainScreen';
import { LoginScreen, MessageScreen } from './screens/LoginScreen';

const APP_NAME = 'Impresora térmica';

export function App() {
  const [data, setData] = useState<DataAccess | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    createAppData().then(setData, (err) => setStartError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {data ? (
        <AppDataProvider data={data}>
          <AuthGate />
        </AppDataProvider>
      ) : (
        <MessageScreen title={startError ? 'No se pudo abrir la app' : APP_NAME} message={startError ?? 'Cargando…'} />
      )}
    </SafeAreaProvider>
  );
}

/** Muestra la app solo con una sesión autorizada; si no, la entrada o el motivo. */
function AuthGate() {
  const { state, signIn, signOut } = useAuth(useAppData());

  switch (state.status) {
    case 'checking':
      return <MessageScreen title={APP_NAME} message="Cargando…" />;
    case 'signedOut':
      return <LoginScreen onSignIn={signIn} />;
    case 'noAccess':
      return (
        <MessageScreen
          title="Cuenta sin acceso"
          message={`${state.email} no está autorizada para ver los datos del negocio. Entra con la cuenta del negocio, o agrégala a la tabla members en Supabase.`}
          action={{ label: 'Usar otra cuenta', onPress: signOut }}
        />
      );
    case 'error':
      return <MessageScreen title="No se pudo abrir la app" message={state.message} />;
    case 'signedIn':
      return <MainScreen email={state.email} onSignOut={signOut} />;
  }
}
