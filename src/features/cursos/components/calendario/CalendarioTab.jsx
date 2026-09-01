import { useState, useEffect, useCallback } from "react";
import { calendarioGetByCurso } from "@/features/calendario/services/calendarioService";
import { eventosDelete, eventosCreateSimple, eventosUpdateSimple } from "@/features/eventos/services/eventosService";
import CalendarWidget from "@/components/ui/CalendarWidget";
import { AppModal, Button, Input, Textarea, Select } from "@/components";
import { parseValidationErrors, summarizeValidationErrors } from "@/utils/parseValidationErrors";

const CATEGORIAS = [
  { value: "escuela_padres", label: "Escuela de padres" },
  { value: "tarea",          label: "Reto"              },
  { value: "institucional",  label: "Institucional"     },
];
const EMPTY_FORM = {
  titulo: "", descripcion: "", fechaInicio: "", fechaFin: "",
  hora: "", ubicacion: "", categoria: "institucional",
};

/* ── Texto de error inline debajo de cada campo ────────────────────── */
function FieldError({ message }) {
  if (!message) return null;
  return (
    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-error-hover)", fontWeight: 600 }}>
      {message}
    </p>
  );
}

// ─── Modal crear / editar evento ─────────────────────────────────────────
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
  // Errores específicos por campo, ej: { fechaInicio: "La fecha de inicio debe ser futura" }
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    // Limpiar el error de ese campo apenas el usuario empieza a corregirlo
    if (fieldErrors[k]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.fechaInicio) {
      setError("El título y la fecha de inicio son requeridos.");
      return;
    }
    setSaving(true);
    setError("");
    setFieldErrors({});
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
        await eventosUpdateSimple(evento._id ?? evento.id, body);
      } else {
        await eventosCreateSimple(body);
      }
      onSaved();
    } catch (err) {
      const parsed = parseValidationErrors(err);
      if (parsed) {
        setFieldErrors(parsed);
        setError(summarizeValidationErrors(parsed));
      } else {
        setError(err.message || "No se pudo guardar el evento.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal isOpen onClose={onClose} size="md">
      <AppModal.Header
        title={isEdit ? "Editar evento" : "Nuevo evento"}
        description={isEdit ? "Modifica los datos del evento" : "Crea un evento para este curso"}
        onClose={onClose}
      />
      <AppModal.Body>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, padding: "10px 14px",
              fontSize: 13, color: "var(--color-error-hover)",
            }}>
              {error}
            </div>
          )}

          <div>
            <Input
              label="Título *"
              value={form.titulo}
              onChange={e => set("titulo", e.target.value)}
              placeholder="Nombre del evento"
            />
            <FieldError message={fieldErrors.titulo} />
          </div>

          <div>
            <Textarea
              label="Descripción *"
              value={form.descripcion}
              onChange={e => set("descripcion", e.target.value)}
              placeholder="Descripción del evento (mínimo 10 caracteres)"
              rows={3}
            />
            <FieldError message={fieldErrors.descripcion} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Input
                label="Fecha inicio *"
                type="date"
                value={form.fechaInicio}
                onChange={e => set("fechaInicio", e.target.value)}
              />
              <FieldError message={fieldErrors.fechaInicio} />
            </div>
            <div>
              <Input
                label="Fecha fin *"
                type="date"
                value={form.fechaFin}
                min={form.fechaInicio}
                onChange={e => set("fechaFin", e.target.value)}
              />
              <FieldError message={fieldErrors.fechaFin} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Input
                label="Hora *"
                type="time"
                value={form.hora}
                onChange={e => set("hora", e.target.value)}
              />
              <FieldError message={fieldErrors.hora} />
            </div>
            <div>
              <Select
                label="Categoría *"
                value={form.categoria}
                onChange={e => set("categoria", e.target.value)}
              >
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <FieldError message={fieldErrors.categoria} />
            </div>
          </div>

          <div>
            <Input
              label="Ubicación *"
              value={form.ubicacion}
              onChange={e => set("ubicacion", e.target.value)}
              placeholder="Salón, virtual, etc."
            />
            <FieldError message={fieldErrors.ubicacion} />
          </div>
        </div>
      </AppModal.Body>
      <AppModal.Footer>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear evento"}
        </Button>
      </AppModal.Footer>
    </AppModal>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CalendarioTab — gestiona fetch + CRUD; delega visual a CalendarWidget
// ══════════════════════════════════════════════════════════════════════════
export default function CalendarioTab({ cursoId, canManage }) {
  const [items,   setItems]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [formEvt, setFormEvt] = useState(null); // null | "new" | elemento

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