// src/services/core/requestQueue.js
// Cola de solicitudes single-flight con gestión de AbortController
const inflight = new Map(); // clave -> { promise, controller }

let _uniqueCounter = 0;

export const makeKey = (url, opts = {}) => {
  const method = (opts.method || 'GET').toUpperCase();

  // Las mutaciones (POST/PUT/PATCH/DELETE) y cualquier request con body
  // FormData NUNCA deben deduplicarse entre sí.
  //
  // Por qué: JSON.stringify(unFormData) siempre devuelve "{}" — FormData no
  // expone sus campos como propiedades enumerables propias — así que dos PUT
  // con contenido completamente distinto (ej. un guardado sin enlaces y otro
  // con enlaces, al mismo /tareas/:id) generaban la MISMA key. Si ambos
  // quedaban en vuelo al mismo tiempo, queueRequest() devolvía la promesa
  // del PRIMERO para el SEGUNDO — el segundo request, con los datos
  // correctos, nunca llegaba a hacer fetch().
  //
  // El dedup por key sí tiene sentido para GET (evitar refetches idénticos
  // disparados por renders duplicados), así que solo se desactiva para
  // mutaciones y para bodies no serializables como texto.
  if (method !== 'GET' || opts.body instanceof FormData) {
    return `${method}|${url}|${Date.now()}_${_uniqueCounter++}`;
  }

  const body = opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : '';
  return `${method}|${url}|${body}`;
};

export function queueRequest(key, startFn) {
  if (inflight.has(key)) return inflight.get(key).promise;

  const controller = new AbortController();
  const promise = (async () => {
    try {
      return await startFn(controller.signal);
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, { promise, controller });
  return promise;
}

export function abortAll() {
  for (const { controller } of inflight.values()) {
    try { controller.abort(); } catch (e) { /* ignorar */ }
  }
  inflight.clear();
}

export function abortKey(key) {
  const entry = inflight.get(key);
  if (entry) {
    try { entry.controller.abort(); } catch {}
    inflight.delete(key);
  }
}