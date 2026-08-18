// src/lib/normalizers/entrega.js

/**
 * Normaliza archivos adjuntos
 */
export function normalizeArchivos(archivos) {
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

    publicId: archivo.publicId || archivo.public_id || "",

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
 * Normaliza una entrega individual
 * Compatible con backend parcial, frontend-only o datos enriquecidos
 */
export function normalizeEntrega(data) {
  if (!data) return null;

  return {
    // IDs
    _id: data._id || data.id || null,
    id: data._id || data.id || null,

    tareaId:
      typeof data.tareaId === "object"
        ? data.tareaId._id || data.tareaId.id
        : data.tareaId || null,

    padreId:
      typeof data.padreId === "object"
        ? data.padreId._id || data.padreId.id
        : data.padreId || null,

    // Padre
    padre:
      data.padre && typeof data.padre === "object"
        ? {
            _id: data.padre._id || data.padre.id || null,
            nombre: data.padre.nombre || "Padre",
            apellido: data.padre.apellido || "",
            correo: data.padre.correo || "",
            telefono: data.padre.telefono || "",
            rol: data.padre.rol || "padre",
          }
        : data.padreId && typeof data.padreId === "object"
        ? {
            _id: data.padreId._id || data.padreId.id || null,
            nombre: data.padreId.nombre || "Padre",
            apellido: data.padreId.apellido || "",
            correo: data.padreId.correo || "",
            telefono: data.padreId.telefono || "",
            rol: data.padreId.rol || "padre",
          }
        : null,

    // Tarea
    tarea:
      data.tarea && typeof data.tarea === "object"
        ? {
            _id: data.tarea._id || data.tarea.id || null,
            titulo: data.tarea.titulo || "Tarea",
            descripcion: data.tarea.descripcion || "",
            fechaEntrega: data.tarea.fechaEntrega || null,
            criterios: Array.isArray(data.tarea.criterios)
              ? data.tarea.criterios
              : [],
          }
        : data.tareaId && typeof data.tareaId === "object"
        ? {
            _id: data.tareaId._id || data.tareaId.id || null,
            titulo: data.tareaId.titulo || "Tarea",
            descripcion: data.tareaId.descripcion || "",
            fechaEntrega: data.tareaId.fechaEntrega || null,
            criterios: Array.isArray(data.tareaId.criterios)
              ? data.tareaId.criterios
              : [],
          }
        : null,

    // Respuesta
    textoRespuesta: data.textoRespuesta || "",
    comentario: data.comentario || "",

    // Estado
    estado: data.estado || "borrador",

    // Archivos
    archivos: normalizeArchivos(
      data.archivos ||
        data.archivosAdjuntos ||
        []
    ),

    archivosAdjuntos: normalizeArchivos(
      data.archivosAdjuntos ||
        data.archivos ||
        []
    ),

    // Fechas
    fechaEnvio:
      data.fechaEnvio ||
      data.fechaEntrega ||
      data.createdAt ||
      null,

    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,

    // Calificación — el backend (calificarEntregaValidator.js / Entrega.js)
    // usa "valoracion" (entero 1-5), nunca "nota". Este normalizador antes
    // buscaba data.calificacion.nota, campo que el backend jamás envía, así
    // que SIEMPRE devolvía calificacion: null aunque la entrega sí tuviera
    // valoración — ocultaba la nota tanto al padre (FamiliaEntregasPage)
    // como al docente (EntregasPage).
    calificacion:
      data.calificacion &&
      data.calificacion.valoracion !== undefined &&
      data.calificacion.valoracion !== null
        ? {
            valoracion: data.calificacion.valoracion ?? null,
            comentario: data.calificacion.comentario || "",
            fechaCalificacion:
              data.calificacion.fechaCalificacion || null,

            // "docente" viene de un cache de enriquecimiento manual (ver
            // normalizeAndEnrichEntrega); "docenteId" es como el backend lo
            // manda de verdad cuando popula calificacion.docenteId.
            docente:
              data.calificacion.docente &&
              typeof data.calificacion.docente === "object"
                ? {
                    _id:
                      data.calificacion.docente._id ||
                      data.calificacion.docente.id ||
                      null,
                    nombre:
                      data.calificacion.docente.nombre ||
                      "Docente",
                    apellido:
                      data.calificacion.docente.apellido ||
                      "",
                    correo:
                      data.calificacion.docente.correo ||
                      "",
                  }
                : data.calificacion.docenteId &&
                  typeof data.calificacion.docenteId === "object"
                ? {
                    _id:
                      data.calificacion.docenteId._id ||
                      data.calificacion.docenteId.id ||
                      null,
                    nombre:
                      data.calificacion.docenteId.nombre ||
                      "Docente",
                    apellido:
                      data.calificacion.docenteId.apellido ||
                      "",
                    correo:
                      data.calificacion.docenteId.correo ||
                      "",
                  }
                : null,
          }
        : null,
  };
}

/**
 * Normaliza y enriquece entrega con cache
 */
export function normalizeAndEnrichEntrega(data, cache = {}) {
  if (!data) return null;

  const padreData = cache.padres?.[data.padreId];
  const tareaData = cache.tareas?.[data.tareaId];
  const docenteData = cache.docentes?.[data.calificacion?.docenteId];

  return normalizeEntrega({
    ...data,

    padre: padreData || data.padre,

    tarea: tareaData || data.tarea,

    calificacion: data.calificacion
      ? {
          ...data.calificacion,
          docente: docenteData || data.calificacion.docente,
        }
      : null,
  });
}

/**
 * Normaliza múltiples entregas
 */
export function normalizeEntregas(entregas) {
  if (!Array.isArray(entregas)) return [];
  return entregas.map(normalizeEntrega).filter(Boolean);
}

/**
 * Enriquecer múltiples entregas usando cache externo
 */
export function normalizeAndEnrichEntregas(entregas, cache = {}) {
  if (!Array.isArray(entregas)) return [];
  return entregas
    .map((entrega) => normalizeAndEnrichEntrega(entrega, cache))
    .filter(Boolean);
}
export async function enrichEntregasData(entregas) {
  if (!Array.isArray(entregas) || entregas.length === 0) {
    return [];
  }

  // Importación dinámica para evitar problemas de inicialización circular con Vite
  const [{ usersGetById }, { tareasGetById }] = await Promise.all([
    import("@/services/usersService"),
    import("@/features/cursos/services/tareasService"),
  ]);

  const cache = {
    padres: {},
    tareas: {},
    docentes: {},
  };

  try {
    const padreIds = [
      ...new Set(
        entregas
          .map((e) => e.padreId)
          .filter((id) => id && typeof id === "string")
      ),
    ];

    const tareaIds = [
      ...new Set(
        entregas
          .map((e) => e.tareaId)
          .filter((id) => id && typeof id === "string")
      ),
    ];

    const docenteIds = [
      ...new Set(
        entregas
          .flatMap((e) =>
            e.calificacion?.docenteId
              ? [e.calificacion.docenteId]
              : []
          )
          .filter((id) => id && typeof id === "string")
      ),
    ];

    const promises = [];

    // Padres
    for (const padreId of padreIds) {
      promises.push(
        usersGetById(padreId)
          .then((data) => {
            cache.padres[padreId] = data.user || data;
          })
          .catch(() => {
            cache.padres[padreId] = null;
          })
      );
    }

    // Tareas
    for (const tareaId of tareaIds) {
      promises.push(
        tareasGetById(tareaId)
          .then((data) => {
            cache.tareas[tareaId] = data.tarea || data;
          })
          .catch(() => {
            cache.tareas[tareaId] = null;
          })
      );
    }

    // Docentes
    for (const docenteId of docenteIds) {
      promises.push(
        usersGetById(docenteId)
          .then((data) => {
            cache.docentes[docenteId] = data.user || data;
          })
          .catch(() => {
            cache.docentes[docenteId] = null;
          })
      );
    }

    await Promise.all(promises);

    return entregas.map((entrega) =>
      normalizeAndEnrichEntrega(
        entrega,
        cache
      )
    );
  } catch (err) {
    console.error(
      "❌ Error en enrichEntregasData:",
      err
    );

    return entregas.map((entrega) =>
      normalizeAndEnrichEntrega(
        entrega,
        {}
      )
    );
  }
}