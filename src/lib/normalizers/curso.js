import { normalizeUser } from "./user";

export function normalizeCurso(curso) {
  if (!curso) return null;

  const id = curso._id || curso.id;
  const imgUrl = curso.fotoPortadaUrl || curso.fotoPortada || curso.imagen || null;

  return {
    id,
    _id: id,
    nombre: curso.nombre || "Sin nombre",
    descripcion: curso.descripcion || "",
    imagen: imgUrl,
    fotoPortada: imgUrl,
    estado: curso.estado || "activo",
    docente: curso.docente ? normalizeUser(curso.docente) : null,
    participantes: curso.participantes || [],
    totalParticipantes: curso.totalParticipantes ?? curso.participantes?.length ?? 0,
  };
}
