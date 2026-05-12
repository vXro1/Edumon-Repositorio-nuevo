// src/features/tareas/pages/TareasPage.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Plus, Search, X, RefreshCw, Loader2,
  Calendar, BookOpen, Lock, Trash2, ChevronRight, Paperclip,
} from "lucide-react";

// API
import {
  cursosGetMine,
  cursosGetParticipantes,
  tareasGetAll,
  tareasCreate,
  tareasCerrar,
  tareasDelete,
  modulosGetByCurso,
} from "@/lib/apiClient";

// Hooks & Context
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSearch } from "@/context/SearchContext";

// Utils
import { normalizeCurso } from "@/lib/normalizers/curso";
import { normalizeTarea } from "@/lib/normalizers/tarea";
import { humanizeError } from "@/utils/humanizeError";

// Shared UI — componentes del sistema
import { Toast, Modal, Button, Input, Select } from "@/components";
import { Sk, EmptyState, Field } from "../../cursos/components/shared/ui";
import { makeNotify } from "@/features/cursos/components/shared/helpers";
// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADO_CFG = {
  activa:  { bg: "rgba(22,163,74,0.10)",   color: "#16A34A", label: "Activa"  },
  cerrada: { bg: "rgba(148,163,184,0.15)", color: "#64748B", label: "Cerrada" },
  vencida: { bg: "rgba(220,38,38,0.10)",   color: "#DC2626", label: "Vencida" },
};

const ASIG_CFG = {
  todos:         { label: "Todos",         color: "#0C6AC4" },
  seleccionados: { label: "Seleccionados", color: "#6366F1" },
};

const TIPO_ENTREGA_OPTS = [
  { value: "archivo",     label: "Archivo / Documento"  },
  { value: "texto",       label: "Texto en línea"        },
  { value: "enlace",      label: "Enlace (URL)"           },
  { value: "multimedia",  label: "Multimedia"             },
  { value: "presencial",  label: "Presencial"             },
  { value: "grupal",      label: "Grupal"                 },
];

const INIT_FORM = {
  titulo: "", descripcion: "", cursoId: "", moduloId: "",
  fechaEntrega: "", asignacionTipo: "todos", tipoEntrega: "archivo",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TareasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerSearchHandler } = useSearch();

  const [tareas,        setTareas]        = useState([]);
  const [cursos,        setCursos]        = useState([]);
  const [modulos,       setModulos]       = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [filterCurso,   setFilterCurso]   = useState("");
  const [filterEstado,  setFilterEstado]  = useState("");
  const [toast,         setToast]         = useState({ msg: "", type: "success" });
  const [saving,        setSaving]        = useState(false);

  const [showCreate,                   setShowCreate]                   = useState(false);
  const [form,                         setForm]                         = useState(INIT_FORM);
  const [participantesSeleccionados,   setParticipantesSeleccionados]   = useState([]);
  const [archivos,                     setArchivos]                     = useState([]);
  const fileRef = useRef(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const notify = makeNotify(setToast);

  // ── Cursos del usuario ────────────────────────────────────────────────────
  useEffect(() => {
    cursosGetMine({ limit: 50 })
      .then(d => setCursos((d.cursos ?? []).map(normalizeCurso)))
      .catch(() => {});
  }, []);

  // ── Módulos y participantes al cambiar curso en el form ───────────────────
  useEffect(() => {
    if (!form.cursoId) {
      setModulos([]); setParticipantes([]); setParticipantesSeleccionados([]);
      return;
    }
    modulosGetByCurso(form.cursoId)
      .then(d => setModulos(d.modulos ?? d ?? []))
      .catch(() => setModulos([]));
    cursosGetParticipantes(form.cursoId)
      .then(d => setParticipantes(d.participantes ?? []))
      .catch(() => setParticipantes([]));
  }, [form.cursoId]);

  // ── Carga de tareas ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tareasGetAll({ limit: 200 });
      setTareas((data.tareas ?? []).map(normalizeTarea));
    } catch {
      notify("Error al cargar tareas", "error");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Búsqueda global ───────────────────────────────────────────────────────
  useEffect(() => {
    const unregister = registerSearchHandler("tareas", (q) => {
      const query = q.toLowerCase();
      return {
        tareas: tareas
          .filter(t =>
            t.titulo?.toLowerCase().includes(query) ||
            t.descripcion?.toLowerCase().includes(query)
          )
          .slice(0, 5),
      };
    });
    return unregister;
  }, [tareas, registerSearchHandler]);

  // ── Filtro local ──────────────────────────────────────────────────────────
  const filtered = tareas.filter(t => {
    const q = search.toLowerCase();
    const matchSearch  = !q || t.titulo?.toLowerCase().includes(q) || t.descripcion?.toLowerCase().includes(q);
    const matchEstado  = !filterEstado || t.estado === filterEstado;
    const matchCurso   = !filterCurso  || (t.curso?._id ?? t.curso?.id ?? t.cursoId) === filterCurso;
    return matchSearch && matchEstado && matchCurso;
  });

  // ── Helper de campo ───────────────────────────────────────────────────────
  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  // ── Crear tarea ───────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("titulo",        form.titulo);
      fd.append("descripcion",   form.descripcion);
      fd.append("cursoId",       form.cursoId);
      if (form.moduloId)     fd.append("moduloId",     form.moduloId);
      if (form.fechaEntrega) fd.append("fechaEntrega", form.fechaEntrega);
      fd.append("asignacionTipo", form.asignacionTipo);
      fd.append("tipoEntrega",    form.tipoEntrega || "archivo");
      fd.append("docenteId",      user?._id ?? user?.id ?? "");
      if (form.asignacionTipo === "seleccionados") {
        participantesSeleccionados.forEach(pId => fd.append("participantesSeleccionados", pId));
      }
      archivos.forEach(file => fd.append("archivos", file));

      await tareasCreate(fd);
      notify("Tarea creada correctamente");
      setShowCreate(false);
      setForm(INIT_FORM);
      setParticipantesSeleccionados([]);
      setArchivos([]);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al crear tarea"), "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Cerrar tarea ──────────────────────────────────────────────────────────
  const handleCerrar = async (id) => {
    if (!window.confirm("¿Cerrar esta tarea? No se aceptarán más entregas.")) return;
    try {
      await tareasCerrar(id);
      notify("Tarea cerrada");
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al cerrar tarea"), "error");
    }
  };

  // ── Eliminar tarea ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await tareasDelete(deletingId);
      notify("Tarea eliminada");
      setShowDelete(false);
      setDeletingId(null);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al eliminar"), "error");
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(99,102,241,0.10)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ClipboardList style={{ width: 18, height: 18, color: "#6366F1" }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
              Tareas
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            {filtered.length} tarea{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={load}
            title="Actualizar"
          >
            <RefreshCw style={{ width: 15, height: 15 }} />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setForm(INIT_FORM);
              setArchivos([]);
              setParticipantesSeleccionados([]);
              setShowCreate(true);
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Nueva tarea
          </Button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{
        background: "var(--color-surface)", borderRadius: 14,
        border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
        padding: "12px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        {/* Búsqueda */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
          <Search style={{ width: 15, height: 15, color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Buscar tareas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 13.5, color: "var(--color-text)", background: "transparent",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Filtro curso */}
        <select
          value={filterCurso}
          onChange={e => setFilterCurso(e.target.value)}
          style={{
            padding: "7px 12px", borderRadius: 9,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)", color: "var(--color-text)",
            fontSize: 13, cursor: "pointer", outline: "none",
          }}
        >
          <option value="">Todos los cursos</option>
          {cursos.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
        </select>

        {/* Filtro estado */}
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          style={{
            padding: "7px 12px", borderRadius: 9,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)", color: "var(--color-text)",
            fontSize: 13, cursor: "pointer", outline: "none",
          }}
        >
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="cerrada">Cerrada</option>
          <option value="vencida">Vencida</option>
        </select>
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2, 3].map(i => <Sk key={i} h={100} r={16} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={search ? "Sin resultados" : "No hay tareas"}
          desc={!search ? "Crea la primera tarea usando el botón de arriba" : undefined}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(t => (
            <TareaCard
              key={t._id}
              tarea={t}
              onVerEntregas={() => navigate(`/tareas/${t._id}/entregas`)}
              onCerrar={() => handleCerrar(t._id)}
              onDelete={() => { setDeletingId(t._id); setShowDelete(true); }}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Modal — Crear tarea
      ══════════════════════════════════════════════ */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setParticipantesSeleccionados([]); }}
        title="Nueva tarea"
        description="La tarea será visible para los participantes del curso seleccionado."
        size="lg"
      >
        <form onSubmit={handleCreate}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* Título */}
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Título *">
                <Input
                  value={form.titulo}
                  onChange={f("titulo")}
                  placeholder="Ej: Tarea de fracciones"
                  required
                />
              </Field>
            </div>

            {/* Descripción */}
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Descripción">
                <Input
                  as="textarea"
                  value={form.descripcion}
                  onChange={f("descripcion")}
                  placeholder="Instrucciones para los padres..."
                  rows={3}
                />
              </Field>
            </div>

            {/* Curso */}
            <Field label="Curso *">
              <Select value={form.cursoId} onChange={f("cursoId")} required>
                <option value="">Seleccionar curso</option>
                {cursos.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </Select>
            </Field>

            {/* Módulo */}
            <Field label="Módulo">
              <Select value={form.moduloId} onChange={f("moduloId")}>
                <option value="">Sin módulo</option>
                {modulos.map(m => <option key={m._id} value={m._id}>{m.titulo}</option>)}
              </Select>
            </Field>

            {/* Fecha de entrega */}
            <Field label="Fecha de entrega">
              <Input
                type="datetime-local"
                value={form.fechaEntrega}
                onChange={f("fechaEntrega")}
              />
            </Field>

            {/* Tipo de entrega */}
            <Field label="Tipo de entrega">
              <Select value={form.tipoEntrega} onChange={f("tipoEntrega")}>
                {TIPO_ENTREGA_OPTS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </Field>

            {/* Asignación */}
            <Field label="Asignación" hint="'Todos' asigna a todos los participantes del curso.">
              <Select value={form.asignacionTipo} onChange={f("asignacionTipo")}>
                <option value="todos">Todos los participantes</option>
                <option value="seleccionados">Participantes seleccionados</option>
              </Select>
            </Field>

            {/* Selector de participantes */}
            {form.asignacionTipo === "seleccionados" && (
              <div style={{ gridColumn: "1 / -1" }}>
                <Field
                  label="Selecciona participantes *"
                  hint={`${participantesSeleccionados.length} de ${participantes.length} seleccionados`}
                >
                  <div style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10, maxHeight: 200, overflowY: "auto", padding: 8,
                  }}>
                    {participantes.length === 0 ? (
                      <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: 8, margin: 0 }}>
                        Selecciona un curso primero
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {participantes.map(p => (
                          <label
                            key={p._id}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "8px 12px", cursor: "pointer", borderRadius: 8,
                              transition: "background 150ms",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(12,106,196,0.05)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <input
                              type="checkbox"
                              checked={participantesSeleccionados.includes(p._id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setParticipantesSeleccionados(prev => [...prev, p._id]);
                                } else {
                                  setParticipantesSeleccionados(prev => prev.filter(id => id !== p._id));
                                }
                              }}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            <span style={{ fontSize: 13, color: "var(--color-text)" }}>
                              {p.nombre} {p.apellido ?? ""}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
              </div>
            )}

            {/* Archivos adjuntos */}
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Archivos adjuntos">
                <div
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#0C6AC4"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border)"}
                  style={{
                    border: "2px dashed var(--color-border)", borderRadius: 12,
                    padding: "16px 20px", textAlign: "center", cursor: "pointer",
                    background: "var(--color-bg)", transition: "border-color 150ms",
                  }}
                >
                  <Paperclip style={{ width: 18, height: 18, color: "var(--color-text-muted)", margin: "0 auto 4px" }} />
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                    {archivos.length > 0
                      ? `${archivos.length} archivo${archivos.length > 1 ? "s" : ""} seleccionado${archivos.length > 1 ? "s" : ""}`
                      : "Clic para adjuntar archivos"}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={e => setArchivos(Array.from(e.target.files))}
                  />
                </div>

                {archivos.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {archivos.map((file, i) => (
                      <span key={i} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "3px 10px", borderRadius: 99,
                        background: "rgba(12,106,196,0.08)",
                        fontSize: 12, color: "#0C6AC4", fontWeight: 600,
                      }}>
                        {file.name}
                        <button
                          type="button"
                          onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#0C6AC4", display: "flex", padding: 0 }}
                        >
                          <X style={{ width: 11, height: 11 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              Crear tarea
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════
          Modal — Confirmar eliminación
      ══════════════════════════════════════════════ */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Eliminar tarea"
        size="sm"
      >
        <p style={{ fontSize: 13.5, color: "var(--color-text-secondary)", marginBottom: 20 }}>
          Esta acción eliminará la tarea y todos sus archivos adjuntos. ¿Deseas continuar?
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" onClick={() => setShowDelete(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─── TareaCard ────────────────────────────────────────────────────────────────

function TareaCard({ tarea: t, onVerEntregas, onCerrar, onDelete }) {
  const [hov, setHov] = useState(false);

  const estadoCfg = ESTADO_CFG[t.estado]         ?? ESTADO_CFG.activa;
  const asigCfg   = ASIG_CFG[t.asignacionTipo]   ?? ASIG_CFG.todos;

  const cursoNombre =
    t.curso?.nombre ??
    (typeof t.cursoId === "object" ? t.cursoId?.nombre : t.cursoId) ??
    "—";

  const modNombre  = t.modulo?.titulo ?? null;
  const fechaVenc  = t.fechaEntrega ? new Date(t.fechaEntrega) : null;
  const fechaStr   = fechaVenc
    ? fechaVenc.toLocaleDateString("es", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  // Estilos de botones de acción inline (pequeños, sin variante dedicada)
  const actionBtn = (color = "var(--color-text-muted)") => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "6px 11px", borderRadius: 8, fontSize: 12, fontWeight: 600,
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    color, cursor: "pointer",
    transition: "background 150ms, border-color 150ms",
  });

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--color-surface)",
        borderRadius: 16,
        border: `1px solid ${hov ? "rgba(12,106,196,0.20)" : "var(--color-border)"}`,
        boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-card)",
        padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 16,
        transition: "all 180ms",
      }}
    >
      {/* Ícono */}
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: "rgba(99,102,241,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ClipboardList style={{ width: 18, height: 18, color: "#6366F1" }} />
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <p style={{ fontWeight: 700, margin: 0, fontSize: 14, color: "var(--color-text)" }}>
            {t.titulo}
          </p>
          <span style={{
            padding: "2px 9px", borderRadius: 99,
            background: estadoCfg.bg, color: estadoCfg.color,
            fontSize: 10.5, fontWeight: 700,
          }}>
            {estadoCfg.label}
          </span>
          <span style={{
            padding: "2px 9px", borderRadius: 99,
            background: "rgba(99,102,241,0.08)", color: asigCfg.color,
            fontSize: 10.5, fontWeight: 700,
          }}>
            {asigCfg.label}
          </span>
        </div>

        <div style={{
          display: "flex", gap: 14, marginTop: 5,
          flexWrap: "wrap", alignItems: "center",
          fontSize: 12, color: "var(--color-text-muted)",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <BookOpen size={11} /> {cursoNombre}
          </span>
          {modNombre && <span>· {modNombre}</span>}
          {fechaStr && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={11} /> Vence: {fechaStr}
            </span>
          )}
          {(t.adjuntos?.length ?? 0) > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Paperclip size={11} /> {t.adjuntos.length} archivo(s)
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={onVerEntregas} style={actionBtn("#0C6AC4")}>
          Entregas <ChevronRight size={13} />
        </button>

        {t.estado === "activa" && (
          <button onClick={onCerrar} style={actionBtn("#64748B")}>
            <Lock size={13} /> Cerrar
          </button>
        )}

        <button
          onClick={onDelete}
          style={actionBtn("var(--color-error, #DC2626)")}
          title="Eliminar tarea"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}