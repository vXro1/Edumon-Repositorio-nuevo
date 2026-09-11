import { useState, useEffect, useCallback, useRef } from "react";

import {
  Plus,
  RefreshCw,
  Loader2,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  X,
  Image,
  Paperclip,
} from "lucide-react";

import { cursosGetMine } from "@/features/cursos/services/cursosService";
import { eventosGetAll, eventosCreate, eventosUpdate, eventosDelete } from "@/features/eventos/services/eventosService";

import { Modal, Toast, Button, Input, Textarea, Select } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";

import { normalizeCurso }from "@/lib/normalizers";
import { humanizeError } from "@/utils/humanizeError";
import { parseValidationErrors, summarizeValidationErrors } from "@/utils/parseValidationErrors";

// solo 3 categorías son válidas para crear/editar (CATEGORIA_FORM_OPTIONS abajo);
// el resto son estilos de fallback para eventos legado con valores que el backend ya no acepta
const CATEGORIA_CFG = {
  tarea:          { color: "#6366F1", bg: "rgba(99,102,241,0.10)",  label: "Reto" },
  escuela_padres: { color: "#D97706", bg: "rgba(217,119,6,0.10)",   label: "Escuela de padres" },
  institucional:  { color: "var(--color-primary)", bg: "rgba(12,106,196,0.10)",  label: "Institucional" },
  reunion:        { color: "var(--color-primary)", bg: "rgba(12,106,196,0.10)",  label: "Reunión" },
  actividad:      { color: "var(--edu-green-600)", bg: "rgba(22,163,74,0.10)",   label: "Actividad" },
  otro:           { color: "#64748B", bg: "rgba(100,116,139,0.10)", label: "Otro" },
};

// único enum que el backend acepta para "categoria"
const CATEGORIA_FORM_OPTIONS = ["escuela_padres", "tarea", "institucional"];

function catCfg(cat) { return CATEGORIA_CFG[cat] ?? CATEGORIA_CFG.otro; }

function toLocalInput(iso) {
  if (!iso) return "";
  try { return new Date(iso).toISOString().slice(0, 16); } catch { return ""; }
}

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

/* ── Texto de error inline debajo de cada campo ────────────────────── */
function FieldError({ message }) {
  if (!message) return null;
  return (
    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-error-hover)", fontWeight: 600 }}>
      {message}
    </p>
  );
}

const INIT_FORM = {
  titulo: "", descripcion: "", fechaInicio: "", fechaFin: "",
  hora: "", ubicacion: "", categoria: "institucional",
};

export default function EventosPage() {
  const [eventos,   setEventos]   = useState([]);
  const [cursos,    setCursos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState({ msg: "", type: "success" });

  const [showForm,       setShowForm]       = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);
  const [form,           setForm]           = useState(INIT_FORM);
  const [cursosIds,      setCursosIds]      = useState([]);
  const [imagenPortada,  setImagenPortada]  = useState(null);
  const [adjunto,        setAdjunto]        = useState(null);
  const [saving,         setSaving]         = useState(false);
  // Errores específicos por campo, ej: { fechaInicio: "La fecha de inicio debe ser futura" }
  const [errors,         setErrors]         = useState({});
  const portadaRef = useRef(null);
  const adjuntoRef = useRef(null);

  const [showDelete,  setShowDelete]  = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);
  const [deleting,    setDeleting]    = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => {
    cursosGetMine({ limit: 50 })
      .then(d => setCursos((d.cursos ?? []).map(normalizeCurso)))
      .catch(() => {});
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

  // Limpia el error de un campo apenas el usuario empieza a corregirlo,
  // así el mensaje no queda pegado tras el primer intento fallido.
  const clearError = (key) => {
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const updateForm = (key, value) => {
    clearError(key);
    setForm(f => ({ ...f, [key]: value }));
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(INIT_FORM);
    setCursosIds(cursos.length === 1 ? [cursos[0]._id] : []);
    setImagenPortada(null);
    setAdjunto(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setEditTarget(ev);
    setForm({
      titulo:      ev.titulo      ?? "",
      descripcion: ev.descripcion ?? "",
      fechaInicio: toLocalInput(ev.fechaInicio),
      fechaFin:    toLocalInput(ev.fechaFin),
      hora:        ev.hora        ?? "",
      ubicacion:   ev.ubicacion   ?? "",
      // categoría legado que el backend ya no acepta -> cae a "institucional"
      categoria:   CATEGORIA_FORM_OPTIONS.includes(ev.categoria) ? ev.categoria : "institucional",
    });
    const ids = (ev.cursosIds ?? ev.cursos ?? []).map(c => c._id ?? c);
    setCursosIds(ids);
    setImagenPortada(null);
    setAdjunto(null);
    setErrors({});
    setShowForm(true);
  };

  const toggleCurso = (id) => {
    setCursosIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (cursosIds.length === 0) {
      setErrors({ cursosIds: "Selecciona al menos un curso" });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      cursosIds.forEach(id => fd.append("cursosIds[]", id));
      if (imagenPortada) fd.append("imagenPortada", imagenPortada);
      if (adjunto)       fd.append("adjunto", adjunto);

      if (editTarget) await eventosUpdate(editTarget._id, fd);
      else            await eventosCreate(fd);

      notify(editTarget ? "Evento actualizado" : "Evento creado");
      setShowForm(false);
      load();
    } catch (err) {
      const fieldErrors = parseValidationErrors(err);
      if (fieldErrors) {
        setErrors(fieldErrors);
        notify(summarizeValidationErrors(fieldErrors), "error");
      } else {
        notify(humanizeError(err, "Error al guardar evento"), "error");
      }
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
      load();
    } catch {
      notify("Error al eliminar", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Eventos</h1>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <IconBtn color="var(--color-text-muted)" onClick={load}>
            <RefreshCw />
          </IconBtn>

          <Button variant="primary" onClick={openCreate}>
            <Plus style={{ width: 16, height: 16 }} /> Nuevo evento
          </Button>
        </div>
      </div>

      {/* LISTA */}
      {loading ? (
        <Sk h={80} />
      ) : eventos.length === 0 ? (
        <div style={{
          background: "var(--color-surface)", borderRadius: 14,
          border: "1px solid var(--color-border)", padding: "48px 24px",
          textAlign: "center", color: "var(--color-text-muted)", fontSize: 14,
        }}>
          No hay eventos. Crea uno con el botón de arriba.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {eventos.map(ev => {
            const cfg = catCfg(ev.categoria);
            const portadaUrl = ev.imagenPortada?.url ?? null;
            const adjuntoUrl = ev.adjuntos?.url ?? null;
            const adjuntoNombre = ev.adjuntos?.nombre ?? "Adjunto";
            return (
              <div key={ev._id} style={{
                background: "var(--color-surface)", borderRadius: 14,
                border: "1px solid var(--color-border)", overflow: "hidden",
                boxShadow: "var(--clay-card)",
                display: "flex",
              }}>
                {portadaUrl && (
                  <img
                    src={portadaUrl} alt={ev.titulo}
                    style={{ width: 90, objectFit: "cover", flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{
                      display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 8px",
                      borderRadius: 999, background: cfg.bg, color: cfg.color, flexShrink: 0,
                      boxShadow: "var(--clay-pill)",
                    }}>
                      {cfg.label}
                    </span>
                    <strong style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.3 }}>
                      {ev.titulo}
                    </strong>
                  </div>
                  {ev.descripcion && (
                    <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: "6px 0 0",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.descripcion}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                    {ev.fechaInicio && (
                      <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} />
                        {new Date(ev.fechaInicio).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                    {ev.ubicacion && (
                      <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={11} /> {ev.ubicacion}
                      </span>
                    )}
                    {adjuntoUrl && (
                      <a
                        href={adjuntoUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11.5, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                      >
                        <Paperclip size={11} /> {adjuntoNombre}
                      </a>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", flexShrink: 0 }}>
                  <Button variant="outline" size="sm" onClick={() => openEdit(ev)}>
                    <Edit2 size={14} /> Editar
                  </Button>
                  <IconBtn label="Eliminar" color="var(--color-error-hover)" onClick={() => { setDeletingId(ev._id); setShowDelete(true); }}>
                    <Trash2 size={14} />
                  </IconBtn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Evento">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div>
            <Input
              label="Título *"
              name="titulo"
              value={form.titulo}
              onChange={(e) => updateForm("titulo", e.target.value)}
              placeholder="Nombre del evento"
              required
            />
            <FieldError message={errors.titulo} />
          </div>

          <div>
            <Textarea
              label="Descripción *"
              name="descripcion"
              value={form.descripcion}
              onChange={(e) => updateForm("descripcion", e.target.value)}
              placeholder="Descripción del evento (mínimo 10 caracteres)"
              rows={3}
            />
            <FieldError message={errors.descripcion} />
          </div>

          <div>
            <Input
              label="Fecha de inicio *"
              name="fechaInicio"
              type="datetime-local"
              value={form.fechaInicio}
              onChange={(e) => updateForm("fechaInicio", e.target.value)}
            />
            <FieldError message={errors.fechaInicio} />
          </div>

          <div>
            <Input
              label="Fecha de fin *"
              name="fechaFin"
              type="datetime-local"
              value={form.fechaFin}
              onChange={(e) => updateForm("fechaFin", e.target.value)}
            />
            <FieldError message={errors.fechaFin} />
          </div>

          <div>
            <Input
              label="Hora *"
              name="hora"
              type="time"
              value={form.hora}
              onChange={(e) => updateForm("hora", e.target.value)}
            />
            <FieldError message={errors.hora} />
          </div>

          <div>
            <Input
              label="Ubicación *"
              name="ubicacion"
              value={form.ubicacion}
              onChange={(e) => updateForm("ubicacion", e.target.value)}
              placeholder="Aula, sala, enlace…"
              leftIcon={<MapPin size={16} />}
            />
            <FieldError message={errors.ubicacion} />
          </div>

          <div>
            <Select
              label="Categoría *"
              name="categoria"
              value={form.categoria}
              onChange={(e) => updateForm("categoria", e.target.value)}
              required
            >
              {CATEGORIA_FORM_OPTIONS.map((key) => (
                <option key={key} value={key}>{CATEGORIA_CFG[key].label}</option>
              ))}
            </Select>
            <FieldError message={errors.categoria} />
          </div>

          {/* el backend exige cursosIds como array en cada creación/edición */}
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)",
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, margin: "0 0 6px" }}>
              Cursos asociados *
            </p>
            {cursos.length === 0 ? (
              <p style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                No tienes cursos disponibles para asociar.
              </p>
            ) : (
              <div style={{
                display: "flex", flexDirection: "column", gap: 6,
                maxHeight: 160, overflowY: "auto",
                border: "1px solid var(--color-border)", borderRadius: 8, padding: 8,
              }}>
                {cursos.map((c) => (
                  <label
                    key={c._id}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={cursosIds.includes(c._id)}
                      onChange={() => { clearError("cursosIds"); toggleCurso(c._id); }}
                    />
                    {c.nombre}
                  </label>
                ))}
              </div>
            )}
            <FieldError message={errors.cursosIds} />
          </div>

          {/* Imagen de portada */}
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)",
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, margin: "0 0 6px" }}>
              Imagen de portada
            </p>
            <input
              ref={portadaRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={e => setImagenPortada(e.target.files[0] ?? null)}
            />
            <button
              type="button" onClick={() => portadaRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "none", border: "1.5px dashed var(--color-border)",
                borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                fontSize: 12.5, color: "var(--color-text-muted)", width: "100%",
              }}
            >
              <Image size={14} />
              {imagenPortada ? imagenPortada.name : "Seleccionar imagen de portada (opcional)"}
              {imagenPortada && (
                <span
                  onClick={e => { e.stopPropagation(); setImagenPortada(null); }}
                  style={{ marginLeft: "auto", cursor: "pointer", color: "var(--color-error-hover)" }}
                >
                  <X size={13} />
                </span>
              )}
            </button>
          </div>

          {/* Adjunto */}
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)",
              textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
              Archivo adjunto
            </p>
            <input
              ref={adjuntoRef} type="file"
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: "none" }}
              onChange={e => setAdjunto(e.target.files[0] ?? null)}
            />
            <button
              type="button" onClick={() => adjuntoRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "none", border: "1.5px dashed var(--color-border)",
                borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                fontSize: 12.5, color: "var(--color-text-muted)", width: "100%",
              }}
            >
              <Paperclip size={14} />
              {adjunto ? adjunto.name : "Adjuntar archivo (imagen, PDF, Word — opcional)"}
              {adjunto && (
                <span
                  onClick={e => { e.stopPropagation(); setAdjunto(null); }}
                  style={{ marginLeft: "auto", cursor: "pointer", color: "var(--color-error-hover)" }}
                >
                  <X size={13} />
                </span>
              )}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10,
            paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving && <Loader2 size={14} />}
              Guardar
            </Button>
          </div>

        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar">
        <Button variant="outline" onClick={() => setShowDelete(false)}>
          Cancelar
        </Button>

        <Button variant="danger" onClick={handleDelete} disabled={deleting}>
          {deleting && <Loader2 size={14} />}
          Eliminar
        </Button>
      </Modal>
    </div>
  );
}