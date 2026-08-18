// src/utils/parseValidationErrors.js
//
// El backend (express-validator) responde así cuando falla la validación:
//   {
//     "message": "Errores de validación",
//     "errors": [
//       { "type": "field", "value": "...", "msg": "La descripción debe tener al menos 10 caracteres", "path": "descripcion", "location": "body" },
//       { "type": "field", "value": "...", "msg": "La fecha de inicio debe ser futura", "path": "fechaInicio", "location": "body" }
//     ]
//   }
//
// El problema: ese array de errores llegaba al frontend, pero solo se
// mostraba un mensaje genérico ("Error al guardar evento") sin decir cuál
// campo falló ni por qué. Este helper convierte ese array en un objeto
// { campo: mensaje } para poder pintar el error justo debajo del input
// correspondiente (igual que hace TareaForm con su prop `errors`).
//
// IMPORTANTE: no conozco la forma exacta en la que tu `apiClient` (apiFetch /
// apiFetchFormData) propaga el cuerpo de la respuesta de error hacia el
// `catch`, así que este helper prueba varias formas comunes. Si ninguna
// coincide con tu implementación, revisa cómo `apiClient.js` arma el `throw`
// (idealmente debería adjuntar el `errors` del JSON de la respuesta al
// objeto Error, ej: `Object.assign(new Error(data.message), data)`).
export function parseValidationErrors(err) {
  let rawList =
    err?.errors ??
    err?.data?.errors ??
    err?.response?.data?.errors ??
    err?.body?.errors ??
    null;

  // Fallback: algunos apiClient solo guardan el JSON crudo como texto en
  // err.message (ej: `throw new Error(JSON.stringify(data))`).
  if (!rawList && typeof err?.message === "string") {
    try {
      const parsed = JSON.parse(err.message);
      rawList = parsed?.errors ?? null;
    } catch {
      // err.message no era JSON, no hay nada más que intentar
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

// Mensaje-resumen legible para mostrar en el toast/banner general,
// complementario a los errores de campo (ej: "Revisa 2 campos: descripción, fechaInicio").
export function summarizeValidationErrors(fieldErrors) {
  if (!fieldErrors) return null;
  const campos = Object.keys(fieldErrors);
  if (campos.length === 1) return fieldErrors[campos[0]];
  return `Revisa los campos marcados: ${campos.join(", ")}`;
}