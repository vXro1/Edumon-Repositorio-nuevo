# syntax=docker/dockerfile:1

# ============================================================================
# Etapa 1 — build: compila el SPA (Vite + React) a estáticos.
# Esta etapa NO viaja a producción — el runtime final no tiene Node.
# ============================================================================
#
# node:22-slim (Debian/glibc) en vez de node:22-alpine a propósito: el
# package-lock.json de este repo se genera en Windows, y `npm ci` bajo
# musl (Alpine) falla resolviendo el binario nativo de Rollup específico
# de esa libc (@rollup/rollup-linux-x64-musl — bug conocido de npm con
# dependencias opcionales multiplataforma, npm/cli#4828). Bajo glibc
# resuelve sin problema. La etapa 2 (runtime) sí sigue siendo Alpine —
# ahí no hay binarios nativos de Node de por medio.
FROM node:22-slim AS build
WORKDIR /app

# Copiado por separado de package*.json: esta capa solo se reinvalida cuando
# cambian las dependencias, no en cada cambio de código (mismo patrón que el
# Dockerfile del backend).
COPY package.json package-lock.json ./
# `npm ci` (no `npm install`) a propósito en el backend, pero AQUÍ no
# funciona: package-lock.json se genera en Windows, y ese lockfile marca
# qué binario opcional de Rollup/esbuild aplica a CADA plataforma — bajo
# Linux ni `npm ci` ni `npm install` (mientras el lockfile siga presente)
# resuelven el binario correcto (bug conocido de npm con
# optionalDependencies multiplataforma, npm/cli#4828; el propio mensaje de
# error de npm recomienda borrar el lockfile e instalar de nuevo). Se borra
# aquí SOLO dentro de esta imagen — el package-lock.json del repo no se
# toca — y se resuelve todo de cero contra package.json, ya en Linux.
RUN rm -f package-lock.json && npm install

COPY . .

# Vite "hornea" import.meta.env.VITE_* dentro del bundle en tiempo de build
# — un SPA ya compilado no tiene forma nativa de leer variables de entorno
# en runtime. Por eso NO fijamos una URL real aquí: dejamos un placeholder,
# y el entrypoint de la etapa 2 lo sustituye por la URL real cada vez que
# arranca el contenedor (ver docker-entrypoint.sh). Así la MISMA imagen
# sirve para cualquier entorno sin reconstruir.
#
# Si en cambio se prefiere fijar la URL en tiempo de build (bake clásico),
# basta con pasar --build-arg VITE_API_URL=https://api.tu-dominio.com/api:
# el placeholder nunca llega a existir en el bundle y el entrypoint no
# encuentra nada que sustituir.
ARG VITE_API_URL=__RUNTIME_API_URL__
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ============================================================================
# Etapa 2 — runtime: nginx sirviendo los estáticos. Sin Node, sin npm,
# sin node_modules — imagen final liviana (~30-40MB sobre nginx:alpine).
# ============================================================================
FROM nginx:1.27-alpine AS runtime

# envsubst (paquete gettext) inyecta BACKEND_INTERNAL_URL en nginx.conf al
# arrancar — no viene garantizado en todas las variantes de esta imagen base,
# así que lo instalamos explícitamente en vez de asumirlo.
RUN apk add --no-cache gettext

# La imagen base trae un default.conf propio (listen 80, root genérico) que
# NO usamos — si se deja, nginx intentaría cargarlo también y chocaría con
# nuestro propio server block.
RUN rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY --from=build /app/dist /usr/share/nginx/html

# Usuario sin privilegios, igual que el backend (que corre como "node").
# La imagen base ya trae un usuario/grupo "nginx" (uid/gid 101); solo hace
# falta darle permiso de escritura sobre lo que nginx toca en runtime
# (su pid, sus directorios de caché, y conf.d donde el entrypoint genera
# el .conf final desde la plantilla) y moverlo a un puerto no privilegiado
# (>1024), ya que un proceso sin privilegios no puede bindear el 80.
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx \
      /var/run/nginx.pid \
      /var/cache/nginx \
      /usr/share/nginx/html \
      /etc/nginx/conf.d

# Nombre del servicio de backend dentro de la red de Docker (ver
# docker-compose.yml). Se puede sobreescribir con -e/environment: si el
# servicio de backend se llama distinto o vive en otro host.
ENV BACKEND_INTERNAL_URL=http://backend:4000

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
