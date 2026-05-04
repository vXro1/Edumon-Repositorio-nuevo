// src/features/cursos/utils/cursoMappers.js
export function mapCursoImage(curso, defaultImage) {
  return curso?.imagen || curso?.fotoPortada || defaultImage || null;
}
