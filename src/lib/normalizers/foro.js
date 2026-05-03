import { normalizeUser } from "./user";

export function normalizeMensaje(mensaje) {
  if (!mensaje) return null;

  const id = mensaje._id || mensaje.id;
  return {
    id,
    _id: id,
    contenido: mensaje.contenido || "",
    autor: normalizeUser(mensaje.autor),
    fecha: mensaje.createdAt,
    createdAt: mensaje.createdAt,
    likes: mensaje.likes || [],
    yaLeDioLike: mensaje.yaLeDioLike || false,
    archivos: mensaje.archivos || [],
    respuestas: (mensaje.respuestas || []).map(normalizeMensaje),
  };
}
