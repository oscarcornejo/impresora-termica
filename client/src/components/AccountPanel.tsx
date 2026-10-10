interface AccountPanelProps {
  email: string;
  onSignOut: () => void;
}

/** Cuenta con la que se entró; cerrar sesión borra también la copia del catálogo de este dispositivo. */
export function AccountPanel({ email, onSignOut }: AccountPanelProps) {
  return (
    <section className="panel">
      <h3>Cuenta</h3>
      <p className="account-email">{email}</p>
      <p className="hint">Al cerrar sesión se borra de este dispositivo la copia del catálogo para vender sin conexión.</p>
      <button type="button" className="secondary" onClick={onSignOut}>Cerrar sesión</button>
    </section>
  );
}
