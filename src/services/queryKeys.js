// src/services/queryKeys.js
// Fuente única de verdad para todos los query keys de React Query.
// Usar siempre estas factories en useQuery/useMutation/invalidateQueries.

export const queryKeys = {

  // ─── Cursos ───────────────────────────────────────────────────────────────
  cursos: {
    all:           ()         => ["cursos"],
    list:          (params)   => ["cursos", "list", params ?? {}],
    mine:          ()         => ["cursos", "mine"],
    detail:        (id)       => ["cursos", id],
    participantes: (id)       => ["cursos", id, "participantes"],
    modulos:       (id)       => ["cursos", id, "modulos"],
  },

  // ─── Tareas ───────────────────────────────────────────────────────────────
  tareas: {
    all:     ()         => ["tareas"],
    byCurso: (cursoId)  => ["tareas", "curso", cursoId],
    detail:  (id)       => ["tareas", id],
  },

  // ─── Entregas ─────────────────────────────────────────────────────────────
  entregas: {
    all:     ()         => ["entregas"],
    byTarea: (tareaId)  => ["entregas", "tarea", tareaId],
    mine:    (tareaId)  => ["entregas", "mine", tareaId],
  },

  // ─── Foros ────────────────────────────────────────────────────────────────
  foros: {
    all:       ()        => ["foros"],
    byCurso:   (cursoId) => ["foros", "curso", cursoId],
    detail:    (foroId)  => ["foros", foroId],
    messages:  (foroId)  => ["foros", foroId, "mensajes"],
    dashboard: (foroId)  => ["foros", foroId, "dashboard"],
  },

  // ─── Eventos ──────────────────────────────────────────────────────────────
  eventos: {
    all:     ()         => ["eventos"],
    byCurso: (cursoId)  => ["eventos", "curso", cursoId],
    hoy:     ()         => ["eventos", "hoy"],
    detail:  (id)       => ["eventos", id],
  },

  // ─── Usuarios ─────────────────────────────────────────────────────────────
  usuarios: {
    all:    ()   => ["usuarios"],
    detail: (id) => ["usuarios", id],
  },

  // ─── Sesiones ─────────────────────────────────────────────────────────────
  sesiones: {
    list: (page) => ["sesiones", page ?? 1],
  },

  // ─── Notificaciones ───────────────────────────────────────────────────────
  notificaciones: {
    all:    ()   => ["notificaciones"],
    unread: ()   => ["notificaciones", "unread"],
  },

  // ─── Instituciones ────────────────────────────────────────────────────────
  instituciones: {
    all:    ()   => ["instituciones"],
    detail: (id) => ["instituciones", id],
  },

  // ─── Buzon ────────────────────────────────────────────────────────────────
  buzon: {
    mensajes: (params) => ["buzon", "mensajes", params ?? {}],
  },
};
