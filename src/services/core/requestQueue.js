// src/services/core/requestQueue.js
// Single-flight request queue with AbortController management
const inflight = new Map(); // key -> { promise, controller }

export const makeKey = (url, opts = {}) => {
  const method = (opts.method || 'GET').toUpperCase();
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
    try { controller.abort(); } catch (e) { /* ignore */ }
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
