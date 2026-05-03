export function normalizeTarea(tarea) {
  if (!tarea) return null;

  const id = tarea._id || tarea.id;
  const curso = tarea.curso && typeof tarea.curso === "object" ? tarea.curso : null;

  return {
    id,
    _id: id,
    titulo: tarea.titulo || "Sin título",
    descripcion: tarea.descripcion || "",
    estado: tarea.estado || "activa",
    fechaEntrega: tarea.fechaEntrega || null,
    asignacionTipo: tarea.asignacionTipo || "todos",
    tipoEntrega: tarea.tipoEntrega || "archivo",
    adjuntos: tarea.adjuntos || tarea.archivos || [],
    curso: curso || (tarea.cursoId ?? null),
    cursoId: tarea.cursoId || (typeof tarea.curso === "string" ? tarea.curso : tarea.curso?._id) || null,
    modulo: tarea.modulo || null,
  };
}
