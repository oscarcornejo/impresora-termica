import { useState, type FormEvent } from 'react';

interface LoginScreenProps {
  onSignIn: (email: string, password: string) => Promise<string | null>;
}

/** Entrada con la cuenta del negocio. La sesión queda guardada en el dispositivo. */
export function LoginScreen({ onSignIn }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Escribe el correo y la contraseña de la cuenta del negocio.');
      return;
    }
    setIsSending(true);
    setError(await onSignIn(email, password));
    setIsSending(false);
  }

  return (
    <main className="auth-page">
      <form className="panel form auth-card" onSubmit={handleSubmit} noValidate aria-labelledby="auth-title">
        <h1 id="auth-title">Impresora térmica</h1>
        <p className="hint">Entra con la cuenta del negocio. Queda guardada en este dispositivo.</p>
        <label className="field">
          <span>Correo</span>
          <input type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="warning" role="alert">{error}</p>}
        <button type="submit" className="primary" disabled={isSending}>{isSending ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  );
}

interface AuthMessageProps {
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

/** Pantalla de estado (cargando, sin acceso, falta configuración). */
export function AuthMessage({ title, message, action }: AuthMessageProps) {
  return (
    <main className="auth-page">
      <section className="panel auth-card" aria-labelledby="auth-title" aria-live="polite">
        <h1 id="auth-title">{title}</h1>
        <p>{message}</p>
        {action && <button type="button" className="secondary" onClick={action.onClick}>{action.label}</button>}
      </section>
    </main>
  );
}
