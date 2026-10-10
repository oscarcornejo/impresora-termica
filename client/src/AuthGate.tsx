import App from './App';
import { AuthMessage, LoginScreen } from './components/LoginScreen';
import { useAuth } from './lib/useAuth';
import { webData } from './lib/storage';

/** Muestra la app solo con una sesión autorizada; si no, la entrada o el motivo. */
export function AuthGate() {
  const { state, signIn, signOut } = useAuth(webData);

  switch (state.status) {
    case 'checking':
      return <AuthMessage title="Impresora térmica" message="Cargando…" />;
    case 'signedOut':
      return <LoginScreen onSignIn={signIn} />;
    case 'noAccess':
      return (
        <AuthMessage
          title="Cuenta sin acceso"
          message={`${state.email} no está autorizada para ver los datos del negocio. Entra con la cuenta del negocio, o agrégala a la tabla members en Supabase.`}
          action={{ label: 'Usar otra cuenta', onClick: () => void signOut() }}
        />
      );
    case 'error':
      return <AuthMessage title="No se pudo abrir la app" message={state.message} />;
    case 'signedIn':
      return <App account={{ email: state.email, onSignOut: () => void signOut() }} />;
  }
}
