// src/features/eventos/pages/EventosPage.jsx

import { useState, useEffect, useCallback, useRef } from "react";

import {
  Calendar,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  BookOpen,
  Trash2,
  Edit2,
  X,
  List,
  LayoutGrid,
} from "lucide-react";

import {
  apiFetch,
  cursosGetMine,
  eventosGetAll,
  eventosCreate,
  eventosUpdate,
  eventosDelete,
} from "@/lib/apiClient";

import { Modal, Toast, Button } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";

import { normalizeCurso } from "@/lib/normalizers";
import { humanizeError } from "@/utils/humanizeError";

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
    <select
      value={value}
      onChange={onChange}
      required={required}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        width: "100%", padding: "9px 12px", fontSize: 13.5,
        borderRadius: 10,
        border: `1.5px solid ${f ? "#0C6AC4" : "var(--color-border)"}`,
        outline: "none",
        background: "var(--color-surface)",
        color: "var(--color-text)",
        cursor: "pointer",
      }}
    >
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
  const [view,      setView]      = useState("lista");
  const [toast,     setToast]     = useState({ msg: "", type: "success" });

  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [cursosIds, setCursosIds] = useState([]);
  const [adjunto, setAdjunto] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  useEffect(() => {
    cursosGetMine({ limit: 50 }).then(d => setCursos((d.cursos ?? []).map(normalizeCurso))).catch(() => {});
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
      titulo: ev.titulo ?? "",
      descripcion: ev.descripcion ?? "",
      fechaInicio: toLocalInput(ev.fechaInicio),
      fechaFin: toLocalInput(ev.fechaFin),
      hora: ev.hora ?? "",
      ubicacion: ev.ubicacion ?? "",
      categoria: ev.categoria ?? "otro",
    });
    const ids = (ev.cursosIds ?? ev.cursos ?? []).map(c => c._id ?? c);
    setCursosIds(ids);
    setAdjunto(null);
    setShowForm(true);
  };

  const toggleCurso = (id) => {
    setCursosIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) await eventosUpdate(editTarget._id, form);
      else await eventosCreate(form);

      notify(editTarget ? "Evento actualizado" : "Evento creado");
      setShowForm(false);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al guardar evento"), "error");
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Eventos</h1>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
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
      ) : (
        eventos.map(ev => (
          <div key={ev._id}>
            <div>
              <strong>{ev.titulo}</strong>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => openEdit(ev)}>
                <Edit2 size={14} /> Editar
              </Button>

              <IconBtn color="#DC2626" onClick={() => { setDeletingId(ev._id); setShowDelete(true); }}>
                <Trash2 />
              </IconBtn>
            </div>
          </div>
        ))
      )}

      {/* FORM MODAL */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Evento">
        <form onSubmit={handleSave}>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cancelar
          </Button>

          <Button variant="primary" disabled={saving} type="submit">
            {saving && <Loader2 />}
            Guardar
          </Button>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar">
        <Button variant="outline" onClick={() => setShowDelete(false)}>
          Cancelar
        </Button>

        <Button variant="danger" onClick={handleDelete} disabled={deleting}>
          {deleting && <Loader2 />}
          Eliminar
        </Button>
      </Modal>
    </div>
  );
}