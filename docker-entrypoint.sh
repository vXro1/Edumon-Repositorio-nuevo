#!/bin/sh
# Se ejecuta una sola vez al arrancar el contenedor, antes de nginx.
set -eu

PLACEHOLDER="__RUNTIME_API_URL__"
RUNTIME_API_URL="${VITE_API_URL:-/api}"

# 1) Inyección "runtime" de VITE_API_URL: el build horneó el placeholder de
#    arriba en vez de una URL real (salvo que se haya pasado --build-arg
#    VITE_API_URL=... en el build, en cuyo caso el placeholder no existe y
#    este bloque no encuentra nada que hacer). Sustituirlo aquí es lo que
#    permite reusar la MISMA imagen en distintos entornos sin reconstruir.
if grep -rlq -- "$PLACEHOLDER" /usr/share/nginx/html 2>/dev/null; then
  grep -rl -- "$PLACEHOLDER" /usr/share/nginx/html | xargs sed -i "s#$PLACEHOLDER#$RUNTIME_API_URL#g"
fi

# 2) Resuelve BACKEND_INTERNAL_URL dentro del server block de nginx.
#    Restringido a esta única variable a propósito: envsubst sin lista
#    explícita reemplazaría también las variables propias de nginx
#    ($uri, $host, $remote_addr, etc.) por cadenas vacías y rompería el
#    proxy_pass.
envsubst '${BACKEND_INTERNAL_URL}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec "$@"
