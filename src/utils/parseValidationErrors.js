// convierte el array de errores de express-validator ({ path, msg }[]) en un
// objeto { campo: mensaje } para pintar el error debajo de cada input
export function parseValidationErrors(err) {
  let rawList =
    err?.errors ??
    err?.data?.errors ??
    err?.response?.data?.errors ??
    err?.body?.errors ??
    null;

  // fallback: algunos errores guardan el JSON crudo como texto en err.message
  if (!rawList && typeof err?.message === "string") {
    try {
      const parsed = JSON.parse(err.message);
      rawList = parsed?.errors ?? null;
    } catch {
      // no era JSON
    }
  }

  if (!Array.isArray(rawList) || rawList.length === 0) return null;

  const fieldErrors = {};
  for (const item of rawList) {
    const field = item.path ?? item.param ?? item.field;
    const msg = item.msg ?? item.message;
    if (field && msg && !fieldErrors[field]) {
      fieldErrors[field] = msg;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

// resumen legible para el toast/banner general
export function summarizeValidationErrors(fieldErrors) {
  if (!fieldErrors) return null;
  const campos = Object.keys(fieldErrors);
  if (campos.length === 1) return fieldErrors[campos[0]];
  return `Revisa los campos marcados: ${campos.join(", ")}`;
}