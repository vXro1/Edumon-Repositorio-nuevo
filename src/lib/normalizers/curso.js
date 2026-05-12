// src/lib/normalizers/curso.js

import { normalizeUser } from "./user";

/**
 * Normaliza un curso individual
 * Compatible con backend parcial, poblado o frontend-only
 */
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

  // Participantes
  const participantes = Array.isArray(curso.participantes)
    ? curso.participantes
    : [];

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
      participantes.length ??
      0,

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

/**
 * Normaliza múltiples cursos
 */
export function normalizeCursos(cursos) {
  if (!Array.isArray(cursos)) return [];
  return cursos.map(normalizeCurso).filter(Boolean);
}

/**
 * Convierte lista de cursos a mapa por ID
 * Útil para acceso rápido en dashboards
 */
export function normalizeCursosMap(cursos) {
  return normalizeCursos(cursos).reduce((acc, curso) => {
    acc[curso.id] = curso;
    return acc;
  }, {});
}