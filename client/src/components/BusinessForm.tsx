import { useState, type FormEvent } from 'react';
import type { Business } from '../lib/types';

interface BusinessFormProps {
  business: Business;
  onSave: (business: Business) => Promise<unknown>;
}

const FIELDS: Array<{ key: keyof Business; label: string; maxLength: number; isMultiline?: boolean }> = [
  { key: 'name', label: 'Nombre del negocio', maxLength: 48 },
  { key: 'address', label: 'Dirección', maxLength: 200 },
  { key: 'phone', label: 'Teléfono', maxLength: 40 },
  { key: 'footer', label: 'Mensaje al final del comprobante', maxLength: 200, isMultiline: true },
];

export function BusinessForm({ business, onSave }: BusinessFormProps) {
  const [fields, setFields] = useState(business);
  const [status, setStatus] = useState<{ isError: boolean; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!fields.name.trim()) return setStatus({ isError: true, text: 'El nombre del negocio es obligatorio' });
    setIsSaving(true);
    try {
      await onSave(fields);
      setStatus({ isError: false, text: 'Guardado' });
    } catch (err) {
      setStatus({ isError: true, text: err instanceof Error ? err.message : 'No se pudo guardar' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel form" onSubmit={handleSubmit} noValidate>
      <h2>Datos del comprobante</h2>
      {FIELDS.map(({ key, label, maxLength, isMultiline }) => (
        <label key={key} className="field">
          <span>{label}</span>
          {isMultiline ? (
            <textarea rows={2} value={fields[key]} maxLength={maxLength} onChange={(e) => setFields({ ...fields, [key]: e.target.value })} />
          ) : (
            <input value={fields[key]} maxLength={maxLength} onChange={(e) => setFields({ ...fields, [key]: e.target.value })} />
          )}
        </label>
      ))}
      {status && <p className={status.isError ? 'warning' : 'ok-text'} role="status">{status.text}</p>}
      <div className="row">
        <button type="submit" disabled={isSaving}>{isSaving ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}
