// src/lib/normalizers/tarea.js

/**
 * Normaliza archivos adjuntos de tareas
 */
export function normalizeArchivosTarea(archivos) {
  if (!Array.isArray(archivos)) return [];

  return archivos.map((archivo, index) => ({
    _id:
      archivo._id ||
      archivo.id ||
      archivo.publicId ||
      `file_${index}_${Date.now()}`,

    url:
      archivo.url ||
      archivo.secure_url ||
      "",

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
 * Normaliza criterios de evaluación
 */
export function normalizeCriterios(criterios) {
  if (!Array.isArray(criterios)) return [];

  return criterios.map((criterio, index) => ({
    _id:
      criterio._id ||
      criterio.id ||
      `criterio_${index}`,

    titulo:
      criterio.titulo ||
      criterio.nombre ||
      "Criterio",

    descripcion:
      criterio.descripcion ||
      "",

    puntaje:
      criterio.puntaje ??
      criterio.valor ??
      0,
  }));
}

// El backend almacena "publicada" para tareas activas y nunca actualiza a "vencida"
const ESTADO_MAP = { publicada: "activa" };

function resolveEstado(estado, fechaEntrega) {
  const base = ESTADO_MAP[estado] ?? estado ?? "activa";
  if (base === "activa" && fechaEntrega && new Date(fechaEntrega) < new Date()) {
    return "vencida";
  }
  return base;
}

/**
 * Normaliza una tarea individual
 * Compatible con backend parcial, frontend-only o datos enriquecidos
 */
export function normalizeTarea(tarea) {
  if (!tarea) return null;

  const id =
    tarea._id ||
    tarea.id ||
    null;

  // Curso
  const curso =
    tarea.curso && typeof tarea.curso === "object"
      ? {
          _id:
            tarea.curso._id ||
            tarea.curso.id ||
            null,
          nombre:
            tarea.curso.nombre ||
            "",
        }
      : tarea.cursoId &&
        typeof tarea.cursoId === "object"
      ? {
          _id:
            tarea.cursoId._id ||
            tarea.cursoId.id ||
            null,
          nombre:
            tarea.cursoId.nombre ||
            "",
        }
      : null;

  // Docente
  const docente =
    tarea.docente && typeof tarea.docente === "object"
      ? {
          _id:
            tarea.docente._id ||
            tarea.docente.id ||
            null,
          nombre:
            tarea.docente.nombre ||
            "",
          apellido:
            tarea.docente.apellido ||
            "",
          correo:
            tarea.docente.correo ||
            "",
          fotoPerfilUrl:
            tarea.docente.fotoPerfilUrl ||
            null,
        }
      : tarea.docenteId &&
        typeof tarea.docenteId === "object"
      ? {
          _id:
            tarea.docenteId._id ||
            tarea.docenteId.id ||
            null,
          nombre:
            tarea.docenteId.nombre ||
            "",
          apellido:
            tarea.docenteId.apellido ||
            "",
          correo:
            tarea.docenteId.correo ||
            "",
          fotoPerfilUrl:
            tarea.docenteId.fotoPerfilUrl ||
            null,
        }
      : null;

  // Adjuntos
  const adjuntos = normalizeArchivosTarea(
    tarea.adjuntos ||
      tarea.archivos ||
      tarea.archivosAdjuntos ||
      []
  );

  // Criterios
  const criterios = normalizeCriterios(
    tarea.criterios
  );

  return {
    // IDs
    id,
    _id: id,

    // Básico
    titulo:
      tarea.titulo ||
      "Sin título",

    descripcion:
      tarea.descripcion ||
      "",

    instrucciones:
      tarea.instrucciones ||
      "",

    estado:
      resolveEstado(tarea.estado, tarea.fechaEntrega),

    prioridad:
      tarea.prioridad ||
      "media",

    categoria:
      tarea.categoria ||
      null,

    // Fechas
    fechaCreacion:
      tarea.fechaCreacion ||
      tarea.createdAt ||
      null,

    fechaEntrega:
      tarea.fechaEntrega ||
      null,

    fechaPublicacion:
      tarea.fechaPublicacion ||
      null,

    createdAt:
      tarea.createdAt ||
      null,

    updatedAt:
      tarea.updatedAt ||
      null,

    // Relaciones
    curso,
    cursoId:
      typeof tarea.cursoId === "string"
        ? tarea.cursoId
        : tarea.curso?._id ||
          tarea.curso?.id ||
          tarea.cursoId?._id ||
          tarea.cursoId?.id ||
          null,

    docente,
    docenteId:
      typeof tarea.docenteId === "string"
        ? tarea.docenteId
        : tarea.docente?._id ||
          tarea.docente?.id ||
          tarea.docenteId?._id ||
          tarea.docenteId?.id ||
          null,

    // Configuración
    asignacionTipo:
      tarea.asignacionTipo ||
      "todos",

    tipoEntrega:
      tarea.tipoEntrega ||
      "archivo",

    permiteEntregaTardia:
      tarea.permiteEntregaTardia ??
      false,

    visible:
      tarea.visible ??
      true,

    puntajeMaximo:
      tarea.puntajeMaximo ??
      100,

    // Contenido
    adjuntos,
    archivos: adjuntos,
    archivosAdjuntos: adjuntos,

    criterios,

    // Progreso / estadísticas
    totalEntregas:
      tarea.totalEntregas ??
      0,

    totalPendientes:
      tarea.totalPendientes ??
      0,

    totalCalificadas:
      tarea.totalCalificadas ??
      0,

    // Extras
    modulo:
      tarea.modulo ||
      null,

    etiquetas:
      Array.isArray(tarea.etiquetas)
        ? tarea.etiquetas
        : [],
  };
}

/**
 * Normaliza múltiples tareas
 */
export function normalizeTareas(tareas) {
  if (!Array.isArray(tareas)) return [];
  return tareas
    .map(normalizeTarea)
    .filter(Boolean);
}

/**
 * Convierte tareas a mapa por ID
 */
export function normalizeTareasMap(tareas) {
  return normalizeTareas(tareas).reduce(
    (acc, tarea) => {
      acc[tarea.id] = tarea;
      return acc;
    },
    {}
  );
}