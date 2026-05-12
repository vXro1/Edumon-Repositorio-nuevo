// src/lib/normalizers/foro.js

import { normalizeUser } from "./user";

/**
 * Normaliza archivos del foro
 */
export function normalizeArchivosForo(archivos) {
  if (!Array.isArray(archivos)) return [];

  return archivos.map((archivo, index) => ({
    _id:
      archivo._id ||
      archivo.id ||
      archivo.publicId ||
      `file_${index}_${Date.now()}`,

    url: archivo.url || archivo.secure_url || "",

    nombre:
      archivo.nombre ||
      archivo.nombreOriginal ||
      archivo.original_filename ||
      "Archivo",

    nombreOriginal:
      archivo.nombreOriginal ||
      archivo.nombre ||
      archivo.original_filename ||
      "Archivo",

    publicId:
      archivo.publicId ||
      archivo.public_id ||
      "",

    tipo:
      archivo.tipo ||
      archivo.tipoArchivo ||
      archivo.mimetype ||
      "application/octet-stream",

    tipoArchivo:
      archivo.tipoArchivo ||
      archivo.tipo ||
      archivo.mimetype ||
      "application/octet-stream",

    tamano:
      archivo.tamano ||
      archivo.size ||
      archivo.bytes ||
      0,
  }));
}

/**
 * Normaliza un mensaje individual del foro
 */
export function normalizeMensaje(mensaje) {
  if (!mensaje) return null;

  const id = mensaje._id || mensaje.id || null;

  // El backend puede poblar el autor en usuarioId, autor o autorId
  const rawAutor =
    (mensaje.usuarioId && typeof mensaje.usuarioId === "object" ? mensaje.usuarioId : null) ||
    (mensaje.autor     && typeof mensaje.autor     === "object" ? mensaje.autor     : null) ||
    (mensaje.autorId   && typeof mensaje.autorId   === "object" ? mensaje.autorId   : null) ||
    null;

  const autor = rawAutor
    ? normalizeUser(rawAutor)
    : {
        _id:
          (typeof mensaje.usuarioId === "string" ? mensaje.usuarioId : null) ||
          (typeof mensaje.autor     === "string" ? mensaje.autor     : null) ||
          (typeof mensaje.autorId   === "string" ? mensaje.autorId   : null) ||
          null,
        nombre: "Usuario",
        apellido: "",
        fotoPerfilUrl: null,
        rol: "",
      };

  return {
    // IDs
    id,
    _id: id,
    foroId: mensaje.foroId || null,

    // Contenido
    contenido: mensaje.contenido || "",
    titulo: mensaje.titulo || "",

    // Autor
    autor,

    autorId:
      autor._id ||
      (typeof mensaje.usuarioId === "string" ? mensaje.usuarioId : null) ||
      (typeof mensaje.autor     === "string" ? mensaje.autor     : null) ||
      (typeof mensaje.autorId   === "string" ? mensaje.autorId   : null) ||
      null,

    // Fechas
    fecha: mensaje.fecha || mensaje.createdAt || null,
    createdAt: mensaje.createdAt || null,
    updatedAt: mensaje.updatedAt || null,

    // Likes
    likes: Array.isArray(mensaje.likes) ? mensaje.likes : [],

    totalLikes:
      mensaje.totalLikes ??
      (Array.isArray(mensaje.likes) ? mensaje.likes.length : 0),

    yaLeDioLike: mensaje.yaLeDioLike || false,

    // Archivos
    archivos: normalizeArchivosForo(
      mensaje.archivos || mensaje.archivosAdjuntos || []
    ),

    // Respuestas anidadas
    respuestaA: mensaje.respuestaA || null,

    respuestas: Array.isArray(mensaje.respuestas)
      ? mensaje.respuestas.map(normalizeMensaje).filter(Boolean)
      : [],

    totalRespuestas:
      mensaje.totalRespuestas ??
      (Array.isArray(mensaje.respuestas) ? mensaje.respuestas.length : 0),

    // Estado / extras
    editado: mensaje.editado || false,
    fijado: mensaje.fijado || false,
    cerrado: mensaje.cerrado || false,
  };
}

/**
 * Normaliza múltiples mensajes
 */
export function normalizeMensajes(mensajes) {
  if (!Array.isArray(mensajes)) return [];
  return mensajes.map(normalizeMensaje).filter(Boolean);
}

/**
 * Normaliza un foro completo
 */
export function normalizeForo(foro) {
  if (!foro) return null;

  const id = foro._id || foro.id || null;

  return {
    // IDs
    id,
    _id: id,

    // Básico
    titulo: foro.titulo || "Foro",
    descripcion: foro.descripcion || "",
    categoria: foro.categoria || null,
    estado: foro.estado || "activo",

    // Curso relacionado
    curso:
      foro.curso && typeof foro.curso === "object"
        ? foro.curso
        : foro.cursoId && typeof foro.cursoId === "object"
        ? foro.cursoId
        : null,

    cursoId:
      typeof foro.cursoId === "string"
        ? foro.cursoId
        : foro.curso?._id ||
          foro.curso?.id ||
          foro.cursoId?._id ||
          foro.cursoId?.id ||
          null,

    // Autor creador
    creador:
      foro.creador && typeof foro.creador === "object"
        ? normalizeUser(foro.creador)
        : foro.creadorId && typeof foro.creadorId === "object"
        ? normalizeUser(foro.creadorId)
        : null,

    creadorId:
      typeof foro.creadorId === "string"
        ? foro.creadorId
        : foro.creador?._id ||
          foro.creador?.id ||
          foro.creadorId?._id ||
          foro.creadorId?.id ||
          null,

    // Mensajes
    mensajes: Array.isArray(foro.mensajes)
      ? foro.mensajes
          .map(normalizeMensaje)
          .filter(Boolean)
      : [],

    totalMensajes:
      foro.totalMensajes ??
      (Array.isArray(foro.mensajes)
        ? foro.mensajes.length
        : 0),

    // Fechas
    createdAt: foro.createdAt || null,
    updatedAt: foro.updatedAt || null,

    // Configuración
    fijado: foro.fijado || false,
    cerrado: foro.cerrado || false,
  };
}

/**
 * Normaliza múltiples foros
 */
export function normalizeForos(foros) {
  if (!Array.isArray(foros)) return [];
  return foros.map(normalizeForo).filter(Boolean);
}