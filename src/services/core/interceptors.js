// Registro simple de interceptores (request/response)
export const requestInterceptors = [];
export const responseInterceptors = [];

export function addRequestInterceptor(fn) {
  requestInterceptors.push(fn);
  return () => {
    const idx = requestInterceptors.indexOf(fn);
    if (idx !== -1) requestInterceptors.splice(idx, 1);
  };
}

export function addResponseInterceptor(fn) {
  responseInterceptors.push(fn);
  return () => {
    const idx = responseInterceptors.indexOf(fn);
    if (idx !== -1) responseInterceptors.splice(idx, 1);
  };
}
