// src/lib/normalizers/tarea.js
//
// Único punto de normalización de una "Tarea" que llega del backend.
// Todo lo que se agrega o cambia aquí debe respetar EXACTAMENTE el
// contrato del backend (Tarea.js / createTareaValidator.js /
// updateTareaValidator.js / tareasController.js):
//
//   - etiquetas               -> Array<String>
//   - criterios               -> String (NO es un array de objetos)
//   - archivosAdjuntos        -> Array<{ tipo: "archivo" | "enlace", url, nombre, ... }>
//                                Los "enlaces" NO son un campo aparte en el modelo:
//                                el backend los guarda mezclados dentro de
//                                archivosAdjuntos con tipo: "enlace".
//   - participantesSeleccionados -> Array<ObjectId> o Array<Usuario poblado>
//
// Cualquier campo que no exista en el backend (puntajeMaximo, permiteEntregaTardia,
// etc.) se mantiene solo como valor por defecto de UI, nunca se envía de vuelta.

/**
 * Normaliza archivos adjuntos de tareas.
 * Se usa tanto para adjuntos tipo "archivo" (Cloudinary) como tipo "enlace"
 * (ambos viven juntos en archivosAdjuntos — ver nota arriba).
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

    // "tipo" es el campo clave para distinguir archivo vs enlace más
    // adelante (TareaDetalle.jsx y TareaForm.jsx filtran por
    // a.tipo === "enlace"). Se preserva tal cual viene del backend.
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
 * Normaliza el módulo asociado a una tarea.
 * Soporta tarea.modulo (objeto), tarea.moduloId (objeto poblado) o
 * tarea.moduloId (string sin poblar).
 */
function normalizeModulo(tarea) {
  if (tarea.modulo && typeof tarea.modulo === "object") {
    return {
      _id: tarea.modulo._id || tarea.modulo.id || null,
      titulo: tarea.modulo.titulo || "",
      descripcion: tarea.modulo.descripcion || "",
    };
  }
  if (tarea.moduloId && typeof tarea.moduloId === "object") {
    return {
      _id: tarea.moduloId._id || tarea.moduloId.id || null,
      titulo: tarea.moduloId.titulo || "",
      descripcion: tarea.moduloId.descripcion || "",
    };
  }
  return null;
}

/**
 * Normaliza la lista de participantes seleccionados.
 * Soporta objetos poblados (con .populate en el backend) o IDs crudos (string).
 */
function normalizeParticipantesSeleccionados(participantes) {
  if (!Array.isArray(participantes)) return [];

  return participantes.map((p) =>
    p && typeof p === "object"
      ? {
          _id: p._id || p.id || null,
          nombre: p.nombre || "",
          apellido: p.apellido || "",
          correo: p.correo || "",
        }
      : p // ID crudo (string) cuando el backend no lo pobló
  );
}

/**
 * Normaliza una tarea individual.
 * Compatible con backend parcial, frontend-only o datos enriquecidos.
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

  // Módulo (mismo patrón que curso/docente)
  const modulo = normalizeModulo(tarea);

  // Adjuntos: incluye tanto archivos (Cloudinary) como enlaces — el backend
  // NO tiene un campo "enlaces" separado en el modelo Tarea, ambos viven
  // juntos en archivosAdjuntos distinguidos por el campo "tipo". Los
  // componentes que necesitan solo enlaces o solo archivos deben filtrar
  // este mismo array (ver TareaDetalle.jsx / TareaForm.jsx: `.filter(a =>
  // a.tipo === "enlace")` / `.filter(a => a.tipo === "archivo")`).
  const adjuntos = normalizeArchivosTarea(
    tarea.adjuntos ||
      tarea.archivos ||
      tarea.archivosAdjuntos ||
      []
  );

  // Criterios: en el backend es un STRING plano, no un array de objetos
  // (ver createTareaValidator.js: body('criterios').optional().trim()).
  // Antes existía normalizeCriterios(), que asumía una estructura de
  // {titulo, descripcion, puntaje}[] que nunca existió en el backend —
  // por eso siempre devolvía [] y el dato "desaparecía" en pantalla aunque
  // sí estuviera guardado. Se eliminó esa función y aquí simplemente se
  // pasa el string tal cual, sin transformarlo.
  const criterios = typeof tarea.criterios === "string" ? tarea.criterios : "";

  // Participantes seleccionados
  const participantesSeleccionados = normalizeParticipantesSeleccionados(
    tarea.participantesSeleccionados
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

    // Módulo (antes se perdía: solo copiaba tarea.modulo, que nunca llega
    // del backend; el backend siempre envía tarea.moduloId poblado)
    modulo,
    moduloId:
      typeof tarea.moduloId === "string"
        ? tarea.moduloId
        : tarea.modulo?._id ||
          tarea.modulo?.id ||
          tarea.moduloId?._id ||
          tarea.moduloId?.id ||
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
    // Se exponen 3 alias (adjuntos / archivos / archivosAdjuntos) apuntando
    // al mismo array ya normalizado, porque distintos componentes del
    // frontend leen con nombres distintos. Es un alias de conveniencia de
    // UI, no una duplicación real de datos ni un campo inventado.
    adjuntos,
    archivos: adjuntos,
    archivosAdjuntos: adjuntos,

    criterios,

    // Participantes (antes no se copiaba en absoluto, por eso el bloque
    // "Asignada a (N)" de TareaDetalle.jsx nunca se mostraba)
    participantesSeleccionados,

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

    // Etiquetas: Array<String> real en el backend. Nunca se hace
    // JSON.parse/JSON.stringify aquí — si tarea.etiquetas ya es un array,
    // se usa tal cual; si no, se cae a [] en vez de intentar "adivinar"
    // un formato roto (evita propagar corrupción histórica de datos).
    etiquetas:
      Array.isArray(tarea.etiquetas)
        ? tarea.etiquetas
        : [],
  };
}

/**
 * Normaliza múltiples tareas.
 */
export function normalizeTareas(tareas) {
  if (!Array.isArray(tareas)) return [];
  return tareas
    .map(normalizeTarea)
    .filter(Boolean);
}

/**
 * Convierte tareas a mapa por ID.
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