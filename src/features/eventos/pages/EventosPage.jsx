// src/features/eventos/pages/EventosPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar, Plus, RefreshCw, Loader2, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, Clock, MapPin, BookOpen, Trash2,
  Edit2, X, List, LayoutGrid,
} from "lucide-react";
import {
  apiFetch,
  cursosGetMine, eventosGetAll, eventosCreate, eventosUpdate, eventosDelete,
} from "@/lib/apiClient";
import Modal from "@/components/ui/Modal";

// ── helpers ─────────────────────────────────────────────────────
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const CATEGORIA_CFG = {
  tarea:          { color: "#6366F1", bg: "rgba(99,102,241,0.10)",  label: "Tarea" },
  escuela_padres: { color: "#D97706", bg: "rgba(217,119,6,0.10)",   label: "Escuela de padres" },
  reunion:        { color: "#0C6AC4", bg: "rgba(12,106,196,0.10)",  label: "Reunión" },
  actividad:      { color: "#16A34A", bg: "rgba(22,163,74,0.10)",   label: "Actividad" },
  otro:           { color: "#64748B", bg: "rgba(100,116,139,0.10)", label: "Otro" },
};

function catCfg(cat) { return CATEGORIA_CFG[cat] ?? CATEGORIA_CFG.otro; }

function toLocalInput(iso) {
  if (!iso) return "";
  try { return new Date(iso).toISOString().slice(0, 16); } catch { return ""; }
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const cfg = {
    success: { bg: "rgba(22,163,74,0.12)", color: "#16A34A", border: "rgba(22,163,74,0.25)" },
    error:   { bg: "rgba(220,38,38,0.12)", color: "#DC2626", border: "rgba(220,38,38,0.25)" },
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

function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = "text", required, as: As = "input", rows }) {
  const [f, setF] = useState(false);
  const base = { width: "100%", padding: "9px 12px", fontSize: 13.5, borderRadius: 10, border: `1.5px solid ${f ? "#0C6AC4" : "var(--color-border)"}`, outline: "none", background: "var(--color-surface)", color: "var(--color-text)", boxShadow: f ? "0 0 0 3px rgba(12,106,196,0.12)" : "none", transition: "border-color 150ms, box-shadow 150ms", resize: As === "textarea" ? "vertical" : undefined };
  const props = { value, onChange, placeholder, required, onFocus: () => setF(true), onBlur: () => setF(false), style: base };
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

const INIT_FORM = {
  titulo: "", descripcion: "", fechaInicio: "", fechaFin: "",
  hora: "", ubicacion: "", categoria: "otro",
};

export default function EventosPage() {
  const [eventos,   setEventos]   = useState([]);
  const [cursos,    setCursos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [view,      setView]      = useState("lista"); // "lista" | "calendario"
  const [toast,     setToast]     = useState({ msg: "", type: "success" });

  // Calendar navigation
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-based

  // Create / Edit
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form,       setForm]       = useState(INIT_FORM);
  const [cursosIds,  setCursosIds]  = useState([]);
  const [adjunto,    setAdjunto]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const fileRef = useRef(null);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => {
    cursosGetMine({ limit: 50 }).then(d => setCursos(d.cursos ?? [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventosGetAll();
      setEventos(data.eventos ?? data.items ?? []);
    } catch {
      notify("Error al cargar eventos", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(INIT_FORM);
    setCursosIds(cursos.length === 1 ? [cursos[0]._id] : []);
    setAdjunto(null);
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setEditTarget(ev);
    setForm({
      titulo:      ev.titulo ?? "",
      descripcion: ev.descripcion ?? "",
      fechaInicio: toLocalInput(ev.fechaInicio),
      fechaFin:    toLocalInput(ev.fechaFin),
      hora:        ev.hora ?? "",
      ubicacion:   ev.ubicacion ?? "",
      categoria:   ev.categoria ?? "otro",
    });
    const ids = (ev.cursosIds ?? ev.cursos ?? []).map(c => c._id ?? c);
    setCursosIds(ids);
    setAdjunto(null);
    setShowForm(true);
  };

  const toggleCurso = (id) => {
    setCursosIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toISO = (v) => {
    if (!v) return "";
    try { return new Date(v).toISOString(); } catch { return v; }
  };

  const buildJsonBody = () => ({
    titulo:      form.titulo,
    descripcion: form.descripcion,
    fechaInicio: toISO(form.fechaInicio),
    fechaFin:    toISO(form.fechaFin),
    ...(form.hora      && { hora:      form.hora }),
    ...(form.ubicacion && { ubicacion: form.ubicacion }),
    categoria:  form.categoria,
    cursosIds,
  });

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("titulo",      form.titulo);
    fd.append("descripcion", form.descripcion);
    fd.append("fechaInicio", toISO(form.fechaInicio));
    fd.append("fechaFin",    toISO(form.fechaFin));
    if (form.hora)      fd.append("hora",      form.hora);
    if (form.ubicacion) fd.append("ubicacion", form.ubicacion);
    fd.append("categoria", form.categoria);
    cursosIds.forEach(id => fd.append("cursosIds", id));
    fd.append("adjunto", adjunto);
    return fd;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim())                     { notify("El título es requerido", "error"); return; }
    if (form.descripcion.trim().length < 10)     { notify("La descripción debe tener al menos 10 caracteres", "error"); return; }
    if (!form.fechaInicio)                       { notify("La fecha de inicio es requerida", "error"); return; }
    if (!form.fechaFin)                          { notify("La fecha de fin es requerida", "error"); return; }
    if (!form.hora)                              { notify("La hora es requerida (formato HH:MM)", "error"); return; }
    if (cursosIds.length === 0)                  { notify("Selecciona al menos un curso", "error"); return; }
    setSaving(true);
    try {
      if (adjunto) {
        // Multipart only when a file is being uploaded
        if (editTarget) {
          await eventosUpdate(editTarget._id, buildFormData());
        } else {
          await eventosCreate(buildFormData());
        }
      } else {
        // JSON body: avoids FormData single-value array parsing issues
        const body = JSON.stringify(buildJsonBody());
        if (editTarget) {
          await apiFetch(`/eventos/${editTarget._id}`, { method: "PUT", body });
        } else {
          await apiFetch("/eventos", { method: "POST", body });
        }
      }
      notify(editTarget ? "Evento actualizado" : "Evento creado");
      setShowForm(false);
      load();
    } catch (err) {
      notify(err.message || "Error al guardar evento", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eventosDelete(deletingId);
      notify("Evento eliminado");
      setShowDelete(false);
      setDeletingId(null);
      load();
    } catch (err) {
      notify(err.message || "Error al eliminar", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Calendar helpers ─────────────────────────────────────────
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfWeek = (y, m) => new Date(y, m, 1).getDay();

  const eventosEnDia = (day) => {
    const d = new Date(calYear, calMonth, day);
    return eventos.filter(ev => {
      const start = ev.fechaInicio ? new Date(ev.fechaInicio) : null;
      const end   = ev.fechaFin   ? new Date(ev.fechaFin)   : null;
      if (!start) return false;
      const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const dEnd   = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : dStart;
      return d >= dStart && d <= dEnd;
    });
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const totalDays   = getDaysInMonth(calYear, calMonth);
  const firstWeekday = getFirstDayOfWeek(calYear, calMonth);
  const calDays = Array.from({ length: firstWeekday }, () => null)
    .concat(Array.from({ length: totalDays }, (_, i) => i + 1));

  const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(217,119,6,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar style={{ width: 18, height: 18, color: "#D97706" }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Eventos</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>{eventos.length} evento{eventos.length !== 1 ? "s" : ""} programados</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {/* View toggle */}
          <div style={{ display: "flex", borderRadius: 10, border: "1px solid var(--color-border)", overflow: "hidden" }}>
            {[{ key: "lista", Icon: List }, { key: "calendario", Icon: LayoutGrid }].map(({ key, Icon }) => (
              <button key={key} onClick={() => setView(key)} style={{ padding: "8px 14px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", background: view === key ? "#0C6AC4" : "var(--color-surface)", color: view === key ? "white" : "var(--color-text-muted)", transition: "all 150ms" }}>
                <Icon style={{ width: 15, height: 15 }} />
              </button>
            ))}
          </div>
          <button onClick={load} title="Actualizar" style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
            <RefreshCw style={{ width: 15, height: 15 }} />
          </button>
          <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
            <Plus style={{ width: 16, height: 16 }} /> Nuevo evento
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VISTA LISTA
          ══════════════════════════════════════════════════════════ */}
      {view === "lista" && (
        <>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[0,1,2,3].map(i => <Sk key={i} h={96} r={16} />)}
            </div>
          ) : eventos.length === 0 ? (
            <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", padding: "60px 24px", textAlign: "center" }}>
              <Calendar style={{ width: 36, height: 36, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)" }}>Sin eventos programados</p>
              <p style={{ fontSize: 13, color: "var(--color-text-subtle)" }}>Crea el primer evento para tu curso</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {eventos.map(ev => (
                <EventoCard
                  key={ev._id}
                  evento={ev}
                  onEdit={() => openEdit(ev)}
                  onDelete={() => { setDeletingId(ev._id); setShowDelete(true); }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          VISTA CALENDARIO
          ══════════════════════════════════════════════════════════ */}
      {view === "calendario" && (
        <div style={{ background: "var(--color-surface)", borderRadius: 18, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
          {/* Nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
            <button onClick={prevMonth} style={{ padding: 8, borderRadius: 9, border: "none", background: "var(--color-bg)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
              <ChevronLeft style={{ width: 18, height: 18 }} />
            </button>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
              {MESES[calMonth]} {calYear}
            </p>
            <button onClick={nextMonth} style={{ padding: 8, borderRadius: 9, border: "none", background: "var(--color-bg)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
              <ChevronRight style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--color-border)" }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {calDays.map((day, idx) => {
              const evs = day ? eventosEnDia(day) : [];
              const isToday = day && calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();
              return (
                <div key={idx} style={{ minHeight: 80, padding: "8px 6px", borderRight: (idx + 1) % 7 !== 0 ? "1px solid var(--color-border)" : "none", borderBottom: "1px solid var(--color-border)", background: isToday ? "rgba(12,106,196,0.04)" : "transparent" }}>
                  {day && (
                    <>
                      <p style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? "#0C6AC4" : "var(--color-text-muted)", margin: "0 0 4px", width: 22, height: 22, borderRadius: "50%", background: isToday ? "rgba(12,106,196,0.14)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {day}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {evs.slice(0, 2).map(ev => {
                          const cc = catCfg(ev.categoria);
                          return (
                            <div key={ev._id} title={ev.titulo} style={{ fontSize: 10.5, fontWeight: 600, color: cc.color, background: cc.bg, borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }} onClick={() => openEdit(ev)}>
                              {ev.titulo}
                            </div>
                          );
                        })}
                        {evs.length > 2 && <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>+{evs.length - 2} más</p>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ FORM MODAL (Create / Edit) ═══════════════════════════ */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? "Editar evento" : "Nuevo evento"}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Título *">
                <StyledInput value={form.titulo} onChange={f("titulo")} placeholder="Ej: Reunión de padres" required />
              </FieldGroup>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Descripción * (mín. 10 caracteres)">
                <StyledInput as="textarea" value={form.descripcion} onChange={f("descripcion")} placeholder="Detalles del evento (mín. 10 caracteres)..." rows={3} required />
                {form.descripcion.length > 0 && form.descripcion.length < 10 && (
                  <p style={{ fontSize: 11.5, color: "#DC2626", marginTop: 3 }}>
                    {10 - form.descripcion.length} caracteres más requeridos
                  </p>
                )}
              </FieldGroup>
            </div>
            <FieldGroup label="Fecha inicio *">
              <StyledInput type="datetime-local" value={form.fechaInicio} onChange={f("fechaInicio")} required />
            </FieldGroup>
            <FieldGroup label="Fecha fin *">
              <StyledInput type="datetime-local" value={form.fechaFin} onChange={f("fechaFin")} required />
            </FieldGroup>
            <FieldGroup label="Hora *">
              <StyledInput type="time" value={form.hora} onChange={f("hora")} required />
            </FieldGroup>
            <FieldGroup label="Categoría">
              <StyledSelect value={form.categoria} onChange={f("categoria")}>
                {Object.entries(CATEGORIA_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </StyledSelect>
            </FieldGroup>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Ubicación">
                <StyledInput value={form.ubicacion} onChange={f("ubicacion")} placeholder="Salón 101, virtual, etc." />
              </FieldGroup>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Cursos *">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                  {cursos.length === 0 && <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Sin cursos disponibles</p>}
                  {cursos.map(c => {
                    const sel = cursosIds.includes(c._id);
                    return (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => toggleCurso(c._id)}
                        style={{ padding: "6px 14px", borderRadius: 99, border: `1.5px solid ${sel ? "#0C6AC4" : "var(--color-border)"}`, background: sel ? "rgba(12,106,196,0.10)" : "var(--color-surface)", color: sel ? "#0C6AC4" : "var(--color-text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 150ms" }}
                      >
                        {c.nombre}
                      </button>
                    );
                  })}
                </div>
                {cursosIds.length === 0 && <p style={{ fontSize: 11.5, color: "#DC2626", marginTop: 4 }}>Selecciona al menos un curso</p>}
              </FieldGroup>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Archivo adjunto">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "1px solid var(--color-border)", background: "var(--color-bg)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>
                    <Plus style={{ width: 13, height: 13 }} /> Adjuntar archivo
                  </button>
                  {adjunto && <span style={{ fontSize: 12.5, color: "#16A34A", fontWeight: 600 }}>{adjunto.name}</span>}
                  {adjunto && <button type="button" onClick={() => setAdjunto(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}><X style={{ width: 13, height: 13 }} /></button>}
                  <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => setAdjunto(e.target.files[0])} />
                </div>
              </FieldGroup>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: saving ? "#6ba4d8" : "#0C6AC4", color: "white", fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              {editTarget ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══ DELETE CONFIRM ═══════════════════════════════════════ */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar evento" size="sm">
        <p style={{ fontSize: 13.5, color: "var(--color-text-secondary)", marginBottom: 20 }}>
          Se eliminará el evento y su archivo adjunto. ¿Continuar?
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

function EventoCard({ evento: ev, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  const cc = catCfg(ev.categoria);
  const fechaI = ev.fechaInicio ? new Date(ev.fechaInicio) : null;
  const fechaF = ev.fechaFin   ? new Date(ev.fechaFin)   : null;
  const cursos = ev.cursos ?? ev.cursosIds ?? [];

  const fmtDate = (d) => d?.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }) ?? "—";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: "var(--color-surface)", borderRadius: 16, border: `1px solid ${hov ? cc.color + "44" : "var(--color-border)"}`, boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-card)", padding: "16px 20px", display: "flex", gap: 16, transition: "all 180ms" }}
    >
      {/* Date badge */}
      <div style={{ width: 52, flexShrink: 0, textAlign: "center" }}>
        <div style={{ borderRadius: 12, background: cc.bg, padding: "8px 4px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: cc.color, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            {fechaI ? MESES[fechaI.getMonth()].slice(0, 3) : "—"}
          </p>
          <p style={{ fontSize: 22, fontWeight: 900, color: cc.color, lineHeight: 1.1, margin: "2px 0 0" }}>
            {fechaI?.getDate() ?? "—"}
          </p>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ fontSize: 14.5, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{ev.titulo}</p>
          <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: cc.bg, color: cc.color }}>{cc.label}</span>
        </div>
        {ev.descripcion && <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ev.descripcion}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 8 }}>
          {ev.hora && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
              <Clock style={{ width: 11, height: 11 }} /> {ev.hora}
            </span>
          )}
          {fechaF && fechaI?.toDateString() !== fechaF.toDateString() && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
              <Calendar style={{ width: 11, height: 11 }} /> Hasta: {fmtDate(fechaF)}
            </span>
          )}
          {ev.ubicacion && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
              <MapPin style={{ width: 11, height: 11 }} /> {ev.ubicacion}
            </span>
          )}
          {cursos.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
              <BookOpen style={{ width: 11, height: 11 }} />
              {cursos.map(c => c.nombre ?? c).join(", ")}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexShrink: 0 }}>
        <button onClick={onEdit} style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "var(--color-text-muted)" }}>
          <Edit2 style={{ width: 13, height: 13 }} /> Editar
        </button>
        <button onClick={onDelete} style={{ padding: "7px 9px", borderRadius: 9, border: "none", background: "rgba(220,38,38,0.08)", cursor: "pointer", display: "flex", alignItems: "center", color: "#DC2626" }}>
          <Trash2 style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}
