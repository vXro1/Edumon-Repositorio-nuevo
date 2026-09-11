// cola de solicitudes single-flight con gestión de AbortController
const inflight = new Map(); // clave -> { promise, controller }

let _uniqueCounter = 0;

export const makeKey = (url, opts = {}) => {
  const method = (opts.method || 'GET').toUpperCase();

  // mutaciones y bodies FormData nunca se deduplican: JSON.stringify(FormData)
  // siempre da "{}", así que dos PUT distintos generarían la misma key y el
  // segundo request perdería su fetch real
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
    try { controller.abort(); } catch { /* ignorar */ }
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