// src/features/cursos/components/calendario/CalendarioTab.jsx
import { useState, useEffect, useCallback } from "react";
import {
  apiFetch,
  calendarioGetByCurso, eventosDelete,
} from "@/lib/apiClient";
import CalendarWidget from "@/components/ui/CalendarWidget";
import { Modal, Button } from "@/components";

const CATEGORIAS = [
  { value: "escuela_padres", label: "Escuela de padres" },
  { value: "tarea",          label: "Tarea"             },
  { value: "institucional",  label: "Institucional"     },
];
const EMPTY_FORM = {
  titulo: "", descripcion: "", fechaInicio: "", fechaFin: "",
  hora: "", ubicacion: "", categoria: "institucional",
};

// ─── Modal crear / editar evento ──────────────────────────────────────────
function EventoFormModal({ cursoId, evento, onClose, onSaved }) {
  const isEdit = !!evento;
  const [form,   setForm]   = useState(
    isEdit
      ? {
          titulo:      evento.titulo      ?? "",
          descripcion: evento.descripcion ?? "",
          fechaInicio: evento.fechaInicio ? evento.fechaInicio.slice(0, 10) : "",
          fechaFin:    evento.fechaFin    ? evento.fechaFin.slice(0, 10)    : "",
          hora:        evento.hora        ?? "",
          ubicacion:   evento.ubicacion   ?? "",
          categoria:   evento.categoria   ?? "institucional",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.fechaInicio) {
      setError("El título y la fecha de inicio son requeridos.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        titulo:      form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        fechaInicio: form.fechaInicio,
        fechaFin:    form.fechaFin || form.fechaInicio,
        hora:        form.hora,
        ubicacion:   form.ubicacion.trim(),
        categoria:   form.categoria,
      };
      if (!isEdit) body.cursosIds = [cursoId];

      if (isEdit) {
        await apiFetch(`/eventos/${evento._id ?? evento.id}`, { method: "PUT",  body: JSON.stringify(body) });
      } else {
        await apiFetch("/eventos", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
    } catch (err) {
      setError(err.message || "No se pudo guardar el evento.");
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    width: "100%", padding: "9px 12px", fontSize: 13.5,
    border: "1.5px solid var(--color-border)", borderRadius: 10,
    background: "var(--color-bg)", color: "var(--color-text)",
    boxSizing: "border-box",
  };
  const lbl = {
    fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)",
    marginBottom: 5, display: "block",
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title={isEdit ? "Editar evento" : "Nuevo evento"}
      description={isEdit ? "Modifica los datos del evento" : "Crea un evento para este curso"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 13, color: "#dc2626",
          }}>
            {error}
          </div>
        )}

        <div>
          <label style={lbl}>Título *</label>
          <input style={inp} value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Nombre del evento" />
        </div>

        <div>
          <label style={lbl}>Descripción</label>
          <textarea style={{ ...inp, resize: "vertical", minHeight: 76 }} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Descripción opcional" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Fecha inicio *</label>
            <input style={inp} type="date" value={form.fechaInicio} onChange={e => set("fechaInicio", e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Fecha fin</label>
            <input style={inp} type="date" value={form.fechaFin} min={form.fechaInicio} onChange={e => set("fechaFin", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Hora</label>
            <input style={inp} type="time" value={form.hora} onChange={e => set("hora", e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Categoría</label>
            <select style={inp} value={form.categoria} onChange={e => set("categoria", e.target.value)}>
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={lbl}>Ubicación</label>
          <input style={inp} value={form.ubicacion} onChange={e => set("ubicacion", e.target.value)} placeholder="Salón, virtual, etc." />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear evento"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CalendarioTab — gestiona fetch + CRUD; delega visual a CalendarWidget
// ══════════════════════════════════════════════════════════════════════════
export default function CalendarioTab({ cursoId, canManage }) {
  const [items,   setItems]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [formEvt, setFormEvt] = useState(null); // null | "new" | item

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await calendarioGetByCurso(cursoId);
      const sorted = (res.items ?? []).sort(
        (a, b) => new Date(a.fecha) - new Date(b.fecha)
      );
      setItems(sorted);
      setStats(res.estadisticas ?? null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await eventosDelete(id);
    load();
  };

  return (
    <>
      <CalendarWidget
        items={items}
        loading={loading}
        stats={stats}
        canManage={canManage}
        onRefresh={load}
        onCreateEvent={() => setFormEvt("new")}
        onEditEvent={(item) => setFormEvt(item)}
        onDeleteEvent={handleDelete}
        title="Calendario del curso"
      />

      {formEvt && (
        <EventoFormModal
          cursoId={cursoId}
          evento={formEvt === "new" ? null : formEvt}
          onClose={() => setFormEvt(null)}
          onSaved={() => { setFormEvt(null); load(); }}
        />
      )}
    </>
  );
}
