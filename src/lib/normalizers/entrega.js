import { normalizeUser } from "./user";

export function normalizeEntrega(entrega) {
  if (!entrega) return null;

  const id = entrega._id || entrega.id;
  return {
    id,
    _id: id,
    estado: entrega.estado || "borrador",
    fecha: entrega.createdAt,
    fechaEnvio: entrega.fechaEnvio || entrega.createdAt,
    padre: normalizeUser(entrega.padre),
    estudiante: normalizeUser(entrega.estudiante),
    archivos: entrega.archivosAdjuntos || entrega.archivos || entrega.adjuntos || [],
    textoRespuesta: entrega.textoRespuesta || "",
    calificacion: entrega.calificacion || null,
  };
}
