import { normalizeUser } from "./user";

// soporta inscripción con usuario anidado, usuario plano ya poblado, o string sin poblar
function normalizeParticipante(p) {
  if (!p) return null;

  // ID crudo, sin poblar
  if (typeof p === "string") {
    return { _id: p, usuarioId: p, nombre: "", apellido: "", correo: "", rol: null };
  }

  // Registro de inscripción con usuario anidado
  const usuarioRaw = p.usuario ?? p.usuarioId ?? p;
  const usuario =
    usuarioRaw && typeof usuarioRaw === "object"
      ? normalizeUser(usuarioRaw)
      : null;

  return {
    _id: p._id || p.id || usuario?._id || null,
    usuarioId:
      typeof p.usuarioId === "string"
        ? p.usuarioId
        : usuario?._id || (typeof usuarioRaw === "string" ? usuarioRaw : null),

    // Datos del usuario aplanados para acceso directo (p.nombre, p.apellido...)
    nombre: usuario?.nombre || "",
    apellido: usuario?.apellido || "",
    correo: usuario?.correo || "",
    fotoPerfilUrl: usuario?.fotoPerfilUrl || null,

    // Objeto completo del usuario, por si se necesita
    usuario,

    rol: p.rol || p.etiqueta || null,
    fechaInscripcion: p.fechaInscripcion || p.createdAt || null,
  };
}

export function normalizeCurso(curso) {
  if (!curso) return null;

  const id = curso._id || curso.id || null;

  // Imagen / portada
  const imgUrl =
    curso.fotoPortadaUrl ||
    curso.fotoPortada ||
    curso.imagen ||
    curso.image ||
    null;

  // Docente
  const docente =
    curso.docente
      ? normalizeUser(curso.docente)
      : curso.docenteId && typeof curso.docenteId === "object"
      ? normalizeUser(curso.docenteId)
      : null;

  // Participantes (normalizados uno a uno, igual que docente)
  const participantes = Array.isArray(curso.participantes)
    ? curso.participantes.map(normalizeParticipante).filter(Boolean)
    : [];

  // Color del curso (hex, ej. #3B82F6) — asignado por el usuario al crear/editar
  const color =
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(curso.color || "")
      ? curso.color
      : null;

  return {
    // IDs
    id,
    _id: id,

    // Básico
    nombre: curso.nombre || "Sin nombre",
    descripcion: curso.descripcion || "",
    codigo: curso.codigo || "",
    estado: curso.estado || "activo",

    // Imagen
    imagen: imgUrl,
    fotoPortada: imgUrl,
    fotoPortadaUrl: imgUrl,

    // Color
    color,

    // Relaciones
    docente,
    docenteId:
      typeof curso.docenteId === "string"
        ? curso.docenteId
        : curso.docente?._id ||
          curso.docente?.id ||
          curso.docenteId?._id ||
          curso.docenteId?.id ||
          null,

    // Participantes
    participantes,
    totalParticipantes:
      curso.totalParticipantes ??
      participantes.length,

    // Extras académicos
    categoria: curso.categoria || null,
    nivel: curso.nivel || null,
    grado: curso.grado || null,
    seccion: curso.seccion || null,

    // Fechas
    fechaInicio: curso.fechaInicio || null,
    fechaFin: curso.fechaFin || null,
    createdAt: curso.createdAt || null,
    updatedAt: curso.updatedAt || null,
  };
}

export function normalizeCursos(cursos) {
  if (!Array.isArray(cursos)) return [];
  return cursos.map(normalizeCurso).filter(Boolean);
}

export function normalizeCursosMap(cursos) {
  return normalizeCursos(cursos).reduce((acc, curso) => {
    acc[curso.id] = curso;
    return acc;
  }, {});
}