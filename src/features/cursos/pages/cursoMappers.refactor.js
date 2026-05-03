// src/features/cursos/pages/cursoMappers.refactor.js
export function mapCursoImage(curso, defaultImage) {
  return curso?.imagen || curso?.fotoPortada || defaultImage || null;
}
