// src/features/tareas/pages/TareasPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Plus, Search, X, RefreshCw, Loader2,
  CheckCircle2, AlertCircle, Calendar, BookOpen, Users,
  Lock, Trash2, ChevronRight, Paperclip,
} from "lucide-react";
import {
  cursosGetMine, cursosGetParticipantes, tareasGetAll, tareasCreate, tareasCerrar, tareasDelete,
  modulosGetByCurso,
} from "@/lib/apiClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSearch } from "@/context/SearchContext";
import { normalizeCurso, normalizeTarea } from "@/lib/normalizers";
import Modal from "@/components/ui/Modal";
import { humanizeError } from "@/utils/humanizeError";

function Toast({ msg, type }) {
  if (!msg) return null;
  const cfg = {
    success: { bg: "rgba(22,163,74,0.12)", color: "#16A34A", border: "rgba(22,163,74,0.25)" },
    error:   { bg: "rgba(220,38,38,0.12)",  color: "#DC2626", border: "rgba(220,38,38,0.25)" },
  };
  const { bg, color, border } = cfg[type] || cfg.success;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 600, background: bg, color, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, maxWidth: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
      {type === "success" ? <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0 }} /> : <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function FieldGroup({ label, children, hint }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = "text", required, as: As = "input", rows, style: extra }) {
  const [f, setF] = useState(false);
  const props = { value, onChange, placeholder, required, onFocus: () => setF(true), onBlur: () => setF(false), style: { width: "100%", padding: "9px 12px", fontSize: 13.5, borderRadius: 10, border: `1.5px solid ${f ? "#0C6AC4" : "var(--color-border)"}`, outline: "none", background: "var(--color-surface)", color: "var(--color-text)", boxShadow: f ? "0 0 0 3px rgba(12,106,196,0.12)" : "none", transition: "border-color 150ms, box-shadow 150ms", resize: As === "textarea" ? "vertical" : undefined, ...extra } };
  return As === "textarea" ? <textarea {...props} rows={rows ?? 3} /> : <input type={type} {...props} />;
}

function StyledSelect({ value, onChange, children, required }) {
  const [f, setF] = useState(false);
  return (
    <select value={value} onChange={onChange} required={required} onFocus={() => setF(true)} onBlur={() => setF(false)} style={{ width: "100%", padding: "9px 12px", fontSize: 13.5, borderRadius: 10, border: `1.5px solid ${f ? "#0C6AC4" : "var(--color-border)"}`, outline: "none", background: "var(--color-surface)", color: "var(--color-text)", boxShadow: f ? "0 0 0 3px rgba(12,106,196,0.12)" : "none", transition: "border-color 150ms, box-shadow 150ms", cursor: "pointer" }}>
      {children}
    </select>
  );
}

const ESTADO_CFG = {
  activa:  { bg: "rgba(22,163,74,0.10)",   color: "#16A34A", label: "Activa" },
  cerrada: { bg: "rgba(148,163,184,0.15)", color: "#64748B", label: "Cerrada" },
  vencida: { bg: "rgba(220,38,38,0.10)",   color: "#DC2626", label: "Vencida" },
};

const ASIG_CFG = {
  todos:         { label: "Todos",           color: "#0C6AC4" },
  seleccionados: { label: "Seleccionados",   color: "#6366F1" },
};

const TIPO_ENTREGA_OPTS = [
  { value: "archivo",  label: "Archivo / Documento" },
  { value: "texto",    label: "Texto en línea" },
  { value: "enlace",   label: "Enlace (URL)" },
  { value: "ninguno",  label: "Sin entrega requerida" },
];

const INIT_FORM = {
  titulo: "", descripcion: "", cursoId: "", moduloId: "",
  fechaEntrega: "", asignacionTipo: "todos", tipoEntrega: "archivo",
};

export default function TareasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerSearchHandler } = useSearch();

  const [tareas,    setTareas]    = useState([]);
  const [cursos,    setCursos]    = useState([]);
  const [modulos,   setModulos]   = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filterCurso, setFilterCurso] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [toast,     setToast]     = useState({ msg: "", type: "success" });
  const [saving,    setSaving]    = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState(INIT_FORM);
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);
  const [archivos,   setArchivos]   = useState([]);
  const fileRef = useRef(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  // Load cursos for filter/create
  useEffect(() => {
    cursosGetMine({ limit: 50 }).then(d => setCursos((d.cursos ?? []).map(normalizeCurso))).catch(() => {});
  }, []);

  // Load módulos when course changes in form
  useEffect(() => {
    if (!form.cursoId) { setModulos([]); setParticipantes([]); setParticipantesSeleccionados([]); return; }
    modulosGetByCurso(form.cursoId).then(d => setModulos(d.modulos ?? d ?? [])).catch(() => setModulos([]));
    cursosGetParticipantes(form.cursoId).then(d => setParticipantes(d.participantes ?? [])).catch(() => setParticipantes([]));
  }, [form.cursoId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filterCurso)  params.cursoId = filterCurso;
      if (filterEstado) params.estado  = filterEstado;
      const data = await tareasGetAll(params);
      setTareas((data.tareas ?? []).map(normalizeTarea));
    } catch {
      notify("Error al cargar tareas", "error");
    } finally {
      setLoading(false);
    }
  }, [filterCurso, filterEstado]);

  useEffect(() => { load(); }, [load]);

  // Registrar búsqueda global
  useEffect(() => {
    const unregister = registerSearchHandler("tareas", (q) => {
      const query = q.toLowerCase();
      const filtered = tareas.filter(t =>
        t.titulo?.toLowerCase().includes(query) ||
        t.descripcion?.toLowerCase().includes(query)
      );
      return { tareas: filtered.slice(0, 5) }; // Limitar a 5 resultados
    });
    return unregister;
  }, [tareas, registerSearchHandler]);

  const filtered = tareas.filter(t => {
    const q = search.toLowerCase();
    return !q || t.titulo?.toLowerCase().includes(q) || t.descripcion?.toLowerCase().includes(q);
  });

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("titulo", form.titulo);
      fd.append("descripcion", form.descripcion);
      fd.append("cursoId", form.cursoId);
      if (form.moduloId) fd.append("moduloId", form.moduloId);
      if (form.fechaEntrega) fd.append("fechaEntrega", form.fechaEntrega);
      fd.append("asignacionTipo", form.asignacionTipo);
      fd.append("tipoEntrega", form.tipoEntrega || "archivo");
      fd.append("docenteId", user?._id || user?.id || "");
      
      // Agregar participantesSeleccionados si es necesario
      if (form.asignacionTipo === "seleccionados") {
        participantesSeleccionados.forEach(pId => fd.append("participantesSeleccionados", pId));
      }
      
      archivos.forEach(file => fd.append("archivos", file));
      
      // Debug: mostrar qué se envía
      console.log("FormData enviado:", {
        titulo: form.titulo,
        descripcion: form.descripcion,
        cursoId: form.cursoId,
        moduloId: form.moduloId,
        fechaEntrega: form.fechaEntrega,
        asignacionTipo: form.asignacionTipo,
        tipoEntrega: form.tipoEntrega,
        docenteId: user?._id || user?.id,
        participantesSeleccionados: form.asignacionTipo === "seleccionados" ? participantesSeleccionados : "N/A",
        user: user,
      });
      
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

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardList style={{ width: 18, height: 18, color: "#6366F1" }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Tareas</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>{filtered.length} tarea{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load} title="Actualizar" style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
            <RefreshCw style={{ width: 15, height: 15 }} />
          </button>
          <button onClick={() => { setForm(INIT_FORM); setArchivos([]); setParticipantesSeleccionados([]); setShowCreate(true); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
            <Plus style={{ width: 16, height: 16 }} /> Nueva tarea
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div style={{ background: "var(--color-surface)", borderRadius: 14, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
          <Search style={{ width: 15, height: 15, color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input type="search" placeholder="Buscar tareas..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, color: "var(--color-text)", background: "transparent" }} />
          {search && <button onClick={() => setSearch("")} style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex" }}><X style={{ width: 14, height: 14 }} /></button>}
        </div>
        <select value={filterCurso} onChange={e => setFilterCurso(e.target.value)} style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, cursor: "pointer", outline: "none" }}>
          <option value="">Todos los cursos</option>
          {cursos.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, cursor: "pointer", outline: "none" }}>
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="cerrada">Cerrada</option>
          <option value="vencida">Vencida</option>
        </select>
      </div>

      {/* ── List ───────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0,1,2,3].map(i => <Sk key={i} h={100} r={16} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "60px 24px", textAlign: "center" }}>
          <ClipboardList style={{ width: 36, height: 36, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)" }}>{search ? "Sin resultados" : "No hay tareas"}</p>
          {!search && <p style={{ fontSize: 13, color: "var(--color-text-subtle)" }}>Crea la primera tarea usando el botón de arriba</p>}
        </div>
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

      {/* ══ CREATE MODAL ══════════════════════════════════════════ */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setParticipantesSeleccionados([]); }} title="Nueva tarea" description="La tarea será visible para los participantes del curso seleccionado." size="lg">
        <form onSubmit={handleCreate}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Título *">
                <StyledInput value={form.titulo} onChange={f("titulo")} placeholder="Ej: Tarea de fracciones" required />
              </FieldGroup>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Descripción">
                <StyledInput as="textarea" value={form.descripcion} onChange={f("descripcion")} placeholder="Instrucciones para los padres..." rows={3} />
              </FieldGroup>
            </div>
            <FieldGroup label="Curso *">
              <StyledSelect value={form.cursoId} onChange={f("cursoId")} required>
                <option value="">Seleccionar curso</option>
                {cursos.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </StyledSelect>
            </FieldGroup>
            <FieldGroup label="Módulo">
              <StyledSelect value={form.moduloId} onChange={f("moduloId")}>
                <option value="">Sin módulo</option>
                {modulos.map(m => <option key={m._id} value={m._id}>{m.titulo}</option>)}
              </StyledSelect>
            </FieldGroup>
            <FieldGroup label="Fecha de entrega">
              <StyledInput type="datetime-local" value={form.fechaEntrega} onChange={f("fechaEntrega")} />
            </FieldGroup>
            <FieldGroup label="Tipo de entrega">
              <StyledSelect value={form.tipoEntrega} onChange={f("tipoEntrega")}>
                {TIPO_ENTREGA_OPTS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </StyledSelect>
            </FieldGroup>
            <FieldGroup label="Asignación" hint="'Todos' asigna a todos los participantes del curso.">
              <StyledSelect value={form.asignacionTipo} onChange={f("asignacionTipo")}>
                <option value="todos">Todos los participantes</option>
                <option value="seleccionados">Participantes seleccionados</option>
              </StyledSelect>
            </FieldGroup>
            {form.asignacionTipo === "seleccionados" && (
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldGroup label="Selecciona participantes *" hint={`${participantesSeleccionados.length} de ${participantes.length} seleccionados`}>
                  <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, maxHeight: 200, overflowY: "auto", padding: 8 }}>
                    {participantes.length === 0 ? (
                      <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: 8, margin: 0 }}>Selecciona un curso primero</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {participantes.map(p => (
                          <label key={p._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", borderRadius: 8, transition: "background 150ms" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(12,106,196,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
                            <span style={{ fontSize: 13, color: "var(--color-text)" }}>{p.nombre} {p.apellido ? p.apellido : ""}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </FieldGroup>
              </div>
            )}
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Archivos adjuntos">
                <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed var(--color-border)", borderRadius: 12, padding: "16px 20px", textAlign: "center", cursor: "pointer", background: "var(--color-bg)", transition: "border-color 150ms" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#0C6AC4"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border)"}>
                  <Paperclip style={{ width: 18, height: 18, color: "var(--color-text-muted)", margin: "0 auto 4px" }} />
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>{archivos.length > 0 ? `${archivos.length} archivo${archivos.length > 1 ? "s" : ""} seleccionado${archivos.length > 1 ? "s" : ""}` : "Clic para adjuntar archivos"}</p>
                  <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={e => setArchivos(Array.from(e.target.files))} />
                </div>
                {archivos.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {archivos.map((file, i) => (
                      <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(12,106,196,0.08)", fontSize: 12, color: "#0C6AC4", fontWeight: 600 }}>
                        {file.name}
                        <button type="button" onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#0C6AC4", display: "flex", padding: 0 }}><X style={{ width: 11, height: 11 }} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </FieldGroup>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: saving ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              Crear tarea
            </button>
          </div>
        </form>
      </Modal>

      {/* ══ DELETE CONFIRM ══════════════════════════════════════ */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar tarea" size="sm">
        <p style={{ fontSize: 13.5, color: "var(--color-text-secondary)", marginBottom: 20 }}>
          Esta acción eliminará la tarea y todos sus archivos adjuntos. ¿Deseas continuar?
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => setShowDelete(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleDelete} disabled={deleting} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: deleting ? "#ef9999" : "#DC2626", color: "white", fontSize: 13.5, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            {deleting && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}

function TareaCard({ tarea: t, onVerEntregas, onCerrar, onDelete }) {
  const [hov, setHov] = useState(false);
  const estadoCfg = ESTADO_CFG[t.estado] ?? ESTADO_CFG.activa;
  const asigCfg   = ASIG_CFG[t.asignacionTipo] ?? ASIG_CFG.todos;
  const cursoNombre = t.curso?.nombre ?? (typeof t.cursoId === 'object' ? t.cursoId?.nombre : t.cursoId) ?? "—";
  const modNombre   = t.modulo?.titulo ?? null;

  const fechaVenc = t.fechaEntrega ? new Date(t.fechaEntrega) : null;
  const fechaStr  = fechaVenc ? fechaVenc.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: "var(--color-surface)", borderRadius: 16, border: `1px solid ${hov ? "rgba(12,106,196,0.20)" : "var(--color-border)"}`, boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-card)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, transition: "all 180ms" }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(99,102,241,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ClipboardList style={{ width: 18, height: 18, color: "#6366F1" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ fontSize: 14.5, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{t.titulo}</p>
          <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: estadoCfg.bg, color: estadoCfg.color }}>{estadoCfg.label}</span>
          <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: "rgba(99,102,241,0.08)", color: asigCfg.color }}>{asigCfg.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 5, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
            <BookOpen style={{ width: 11, height: 11 }} /> {cursoNombre}
          </span>
          {modNombre && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-muted)" }}>· {modNombre}</span>}
          {fechaStr && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
            <Calendar style={{ width: 11, height: 11 }} /> Vence: {fechaStr}
          </span>}
          {(t.adjuntos?.length ?? 0) > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
            <Paperclip style={{ width: 11, height: 11 }} /> {t.adjuntos.length} adjunto{t.adjuntos.length > 1 ? "s" : ""}
          </span>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button onClick={onVerEntregas} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "1.5px solid #0C6AC4", background: "transparent", color: "#0C6AC4", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
          Entregas <ChevronRight style={{ width: 13, height: 13 }} />
        </button>
        {t.estado === "activa" && (
          <button onClick={onCerrar} title="Cerrar tarea" style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>
            <Lock style={{ width: 13, height: 13 }} /> Cerrar
          </button>
        )}
        <button onClick={onDelete} title="Eliminar tarea" style={{ padding: "7px 10px", borderRadius: 9, border: "none", background: "rgba(220,38,38,0.08)", cursor: "pointer", display: "flex", alignItems: "center", color: "#DC2626" }}>
          <Trash2 style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}
