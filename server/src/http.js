// Utilidades HTTP compartidas: respuesta { success, data, error } y validación con zod.

export const ok = (res, data, status = 200) => res.status(status).json({ success: true, data, error: null });

export const fail = (res, status, error) => res.status(status).json({ success: false, data: null, error });

export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return { data: result.data };
  const issue = result.error.issues[0];
  return { error: `${issue.path.join('.') || 'body'}: ${issue.message}` };
}
