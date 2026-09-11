// src/utils/formatBytes.js
// Formatea un número de bytes en un texto legible ("12,4 MB").
// Misma lógica que el thumbnail de FileUpload.jsx, extraída para reuso
// (panel de superadmin App móvil + sección de descarga de la landing).

const UNIDADES = ["B", "KB", "MB", "GB"];

export function formatBytes(bytes, decimales = 1) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";

  let valor = n;
  let i = 0;
  while (valor >= 1024 && i < UNIDADES.length - 1) {
    valor /= 1024;
    i += 1;
  }

  // Sin decimales para bytes/KB enteros; con decimales para MB/GB.
  const txt = i <= 1 ? String(Math.round(valor)) : valor.toFixed(decimales);
  return `${txt.replace(".", ",")} ${UNIDADES[i]}`;
}

export default formatBytes;
