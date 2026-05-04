// src/features/entregas/services/entregasService.js
import {
  entregasGetByTarea,
  entregasGetMineByTarea,
  entregasCreate,
  entregasEnviar,
  entregasCalificar,
} from "@/lib/apiClient";
const entregasService = {

  // Docente/Admin: todas las entregas de una tarea con estadísticas
  // GET /api/entregas/tarea/:tareaId
  // Respuesta: { tarea, estadisticas, entregas[], pagination }
  getByTarea(tareaId, params = {}) {
    return entregasGetByTarea(tareaId, params);
  },

  // Padre: SUS propias entregas para una tarea específica
  // GET /api/entregas/mis-entregas/:tareaId
  // Respuesta: entregas[] incluyendo borradores, con calificacion populada
  getMisEntregas(tareaId) {
    return entregasGetMineByTarea(tareaId);
  },

  // Crear entrega (padre)
  // POST /api/entregas — multipart/form-data
  crear(formData) {
    return entregasCreate(formData);
  },

  // Enviar entrega desde borrador
  // PATCH /api/entregas/:id/enviar
  enviar(entregaId) {
    return entregasEnviar(entregaId);
  },

  // Calificar (docente)
  // PATCH /api/entregas/:id/calificar
  calificar(entregaId, { nota, comentario, docenteId }) {
    return entregasCalificar(entregaId, { nota, comentario, docenteId });
  },
};

export default entregasService;