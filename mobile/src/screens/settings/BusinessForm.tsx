import { useEffect, useState } from 'react';
import type { Business } from '@core/types';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Notice } from '../../ui/Notice';

const FIELDS: Array<{ key: keyof Business; label: string; maxLength: number; isMultiline?: boolean }> = [
  { key: 'name', label: 'Nombre del negocio', maxLength: 48 },
  { key: 'address', label: 'Dirección', maxLength: 200 },
  { key: 'phone', label: 'Teléfono', maxLength: 40 },
  { key: 'footer', label: 'Mensaje al final del comprobante', maxLength: 200, isMultiline: true },
];

interface BusinessFormProps {
  business: Business;
  onSave: (business: Business) => Promise<unknown>;
}

export function BusinessForm({ business, onSave }: BusinessFormProps) {
  const [fields, setFields] = useState(business);
  const [status, setStatus] = useState<{ isError: boolean; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setFields(business), [business]);

  async function submit() {
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
    <>
      {FIELDS.map(({ key, label, maxLength, isMultiline }) => (
        <Field
          key={key}
          label={label}
          value={fields[key]}
          maxLength={maxLength}
          multiline={isMultiline}
          onChangeText={(value) => {
            setStatus(null);
            setFields((prev) => ({ ...prev, [key]: value }));
          }}
        />
      ))}
      {status && <Notice kind={status.isError ? 'warning' : 'ok'}>{status.text}</Notice>}
      <Button label={isSaving ? 'Guardando…' : 'Guardar datos'} onPress={submit} isBusy={isSaving} />
    </>
  );
}
