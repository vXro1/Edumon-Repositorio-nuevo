import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  MessageCircle, Plus, RefreshCw, Loader2, CheckCircle2,
  AlertCircle, Lock, Unlock, Trash2, ChevronRight, BookOpen,
  Globe, EyeOff,
} from "lucide-react";

import { cursosGetMine } from "@/features/cursos/services/cursosService";
import {
  forosGetByCurso,
  forosCreate,
  forosCambiarEstado,
  forosDelete,
} from "@/features/foros/services/forosService";

import { Modal, Toast, Button } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";
import { normalizeCurso } from "@/lib/normalizers";
import { humanizeError } from "@/utils/humanizeError";

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
  const props = { value, onChange, placeholder, required, onFocus: () => setF(true), onBlur: () => setF(false), style: { width: "100%", padding: "9px 12px", fontSize: 13.5, borderRadius: 10, border: `1.5px solid ${f ? "var(--color-primary)" : "var(--color-border)"}`, outline: "none", background: "var(--color-surface)", color: "var(--color-text)", boxShadow: f ? "0 0 0 3px rgba(12,106,196,0.12)" : "none", transition: "border-color 150ms, box-shadow 150ms", resize: As === "textarea" ? "vertical" : undefined } };
  return As === "textarea" ? <textarea {...props} rows={rows ?? 3} /> : <input type={type} {...props} />;
}

const INIT_FORM = { titulo: "", descripcion: "", publico: false };

export default function ForosPage() {
  const navigate = useNavigate();

  const [cursos,     setCursos]     = useState([]);
  const [cursoSel,   setCursoSel]   = useState("");
  const [foros,      setForos]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState({ msg: "", type: "success" });
  const [saving,     setSaving]     = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState(INIT_FORM);
  const [archivos,   setArchivos]   = useState([]);
  const fileRef = useRef(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => {
    cursosGetMine({ limit: 50 }).then(d => {
      const list = (d.cursos ?? []).map(normalizeCurso);
      setCursos(list);
      if (list.length > 0) setCursoSel(list[0]._id);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!cursoSel) return;
    setLoading(true);
    try {
      const data = await forosGetByCurso(cursoSel);
      setForos(data.foros ?? data ?? []);
    } catch {
      notify("Error al cargar foros", "error");
    } finally {
      setLoading(false);
    }
  }, [cursoSel]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("titulo", form.titulo);
      fd.append("descripcion", form.descripcion);
      fd.append("cursoId", cursoSel);
      fd.append("publico", form.publico ? "true" : "false");
      archivos.forEach(file => fd.append("archivos", file));
      await forosCreate(fd);
      notify("Foro creado correctamente");
      setShowCreate(false);
      setForm(INIT_FORM);
      setArchivos([]);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al crear foro"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (foro) => {
    const nuevoEstado = foro.estado === "abierto" ? "cerrado" : "abierto";
    try {
      await forosCambiarEstado(foro._id, { estado: nuevoEstado });
      notify(`Foro ${nuevoEstado}`);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al cambiar estado"), "error");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await forosDelete(deletingId);
      notify("Foro eliminado");
      setShowDelete(false);
      setDeletingId(null);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al eliminar"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const selectedCurso = cursos.find(c => c._id === cursoSel);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Cabecera ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle style={{ width: 18, height: 18, color: "#6366F1" }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Foros</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>{foros.length} foro{foros.length !== 1 ? "s" : ""} en este curso</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {/* Solo ícono → IconBtn */}
          <IconBtn color="var(--color-text-muted)" onClick={load} title="Actualizar">
            <RefreshCw style={{ width: 15, height: 15 }} />
          </IconBtn>

          {/* Botón de acción con texto → Button primario */}
          <Button
            variant="primary"
            onClick={() => { setForm(INIT_FORM); setArchivos([]); setShowCreate(true); }}
            disabled={!cursoSel}
          >
            <Plus style={{ width: 16, height: 16 }} /> Nuevo foro
          </Button>
        </div>
      </div>

      {/* ── Selector de curso ────────────────────────────────────── */}
      <div style={{ background: "var(--color-surface)", borderRadius: 14, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <BookOpen style={{ width: 15, height: 15, color: "var(--color-text-muted)", flexShrink: 0 }} />
        <select value={cursoSel} onChange={e => setCursoSel(e.target.value)} style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, color: "var(--color-text)", background: "transparent", cursor: "pointer", fontWeight: 500 }}>
          <option value="">-- Seleccionar curso --</option>
          {cursos.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* ── Lista de foros ─────────────────────────────────────────── */}
      {!cursoSel ? (
        <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", padding: "60px 24px", textAlign: "center" }}>
          <MessageCircle style={{ width: 36, height: 36, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)" }}>Selecciona un curso para ver sus foros</p>
        </div>
      ) : loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0,1,2].map(i => <Sk key={i} h={90} r={16} />)}
        </div>
      ) : foros.length === 0 ? (
        <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", padding: "60px 24px", textAlign: "center" }}>
          <MessageCircle style={{ width: 36, height: 36, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)" }}>Sin foros en este curso</p>
          <p style={{ fontSize: 13, color: "var(--color-text-subtle)" }}>Crea el primer foro para iniciar discusiones</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {foros.map(foro => (
            <ForoCard
              key={foro._id}
              foro={foro}
              onOpen={() => navigate(`/foros/${foro._id}`)}
              onToggle={() => handleToggleEstado(foro)}
              onDelete={() => { setDeletingId(foro._id); setShowDelete(true); }}
            />
          ))}
        </div>
      )}

      {/* ══ MODAL DE CREACIÓN ═══════════════════════════════════════ */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo foro" description={`Curso: ${selectedCurso?.nombre ?? ""}`} size="md">
        <form onSubmit={handleCreate}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FieldGroup label="Título *">
              <StyledInput value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ej: Dudas sobre la tarea de esta semana" required />
            </FieldGroup>
            <FieldGroup label="Descripción *">
              <StyledInput as="textarea" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Contexto del foro para los participantes..." rows={4} required />
            </FieldGroup>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                id="publico-toggle"
                type="checkbox"
                checked={form.publico}
                onChange={e => setForm(p => ({ ...p, publico: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--color-primary)" }}
              />
              <label htmlFor="publico-toggle" style={{ fontSize: 13.5, color: "var(--color-text)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Globe style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
                Foro público (visible para todos)
              </label>
            </div>
            <FieldGroup label="Archivos adjuntos (imágenes, PDF, video)">
              <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed var(--color-border)", borderRadius: 10, padding: "14px 18px", textAlign: "center", cursor: "pointer", background: "var(--color-bg)" }}>
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>{archivos.length > 0 ? `${archivos.length} archivo${archivos.length > 1 ? "s" : ""}` : "Clic para adjuntar"}</p>
                <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf" style={{ display: "none" }} onChange={e => setArchivos(Array.from(e.target.files))} />
              </div>
            </FieldGroup>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            {/* Cancelar → Button outline */}
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>

            {/* Enviar con spinner → Button primario */}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
              Crear foro
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══ CONFIRMACIÓN DE ELIMINACIÓN ══════════════════════════════════════ */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar foro" size="sm">
        <p style={{ fontSize: 13.5, color: "var(--color-text-secondary)", marginBottom: 20 }}>
          Se eliminarán permanentemente el foro y todos sus mensajes. ¿Continuar?
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {/* Cancelar → Button outline */}
          <Button variant="outline" onClick={() => setShowDelete(false)}>
            Cancelar
          </Button>

          {/* Eliminar con spinner → Button de peligro */}
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} />}
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ForoCard({ foro, onOpen, onToggle, onDelete }) {
  // useState(hov) se mantiene porque controla los estilos del <div> contenedor, no de un botón
  const [hov, setHov] = useState(false);
  const abierto = foro.estado === "abierto";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: "var(--color-surface)", borderRadius: 16, border: `1px solid ${hov ? "rgba(99,102,241,0.25)" : "var(--color-border)"}`, boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-card)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, transition: "all 180ms" }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 12, background: abierto ? "rgba(99,102,241,0.10)" : "rgba(148,163,184,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <MessageCircle style={{ width: 19, height: 19, color: abierto ? "#6366F1" : "#94A3B8" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ fontSize: 14.5, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{foro.titulo}</p>
          <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: abierto ? "rgba(22,163,74,0.10)" : "rgba(148,163,184,0.15)", color: abierto ? "var(--edu-green-600)" : "#64748B" }}>
            {abierto ? "Abierto" : "Cerrado"}
          </span>
          {foro.publico !== false && (
            <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "rgba(12,106,196,0.08)", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 3 }}>
              <Globe style={{ width: 9, height: 9 }} /> Público
            </span>
          )}
        </div>
        {foro.descripcion && (
          <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {foro.descripcion}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Alternar estado → Button outline sm (texto + ícono, variante fija) */}
        <Button variant="outline" size="sm" onClick={onToggle} title={abierto ? "Cerrar foro" : "Abrir foro"}>
          {abierto ? <Lock style={{ width: 12, height: 12 }} /> : <Unlock style={{ width: 12, height: 12 }} />}
          {abierto ? "Cerrar" : "Abrir"}
        </Button>

        {/* Ver foro → Button ghost sm */}
        <Button variant="ghost" size="sm" onClick={onOpen}>
          Ver foro <ChevronRight style={{ width: 13, height: 13 }} />
        </Button>

        {/* Solo ícono papelera → IconBtn */}
        <IconBtn color="var(--color-error-hover)" onClick={onDelete} title="Eliminar">
          <Trash2 style={{ width: 13, height: 13 }} />
        </IconBtn>
      </div>
    </div>
  );
}