// src/features/calendario/pages/CalendarioPage.jsx
// Calendario general para docente y administrador.
import { useState, useEffect, useCallback } from "react";
import { CalendarDays } from "lucide-react";
import { cursosGetMine } from "@/features/cursos/services/cursosService";
import { calendarioGetByCurso } from "@/features/calendario/services/calendarioService";
import { eventosDelete, eventosCreateSimple, eventosUpdateSimple } from "@/features/eventos/services/eventosService";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usePermission, PERMISSIONS } from "@/hooks/usePermission";
import CalendarWidget from "@/components/ui/CalendarWidget";
import { Modal, Button } from "@/components";

const CATEGORIAS = [
  { value: "escuela_padres", label: "Escuela de padres" },
  { value: "tarea",          label: "Reto"              },
  { value: "institucional",  label: "Institucional"     },
];

const EMPTY_FORM = {
  titulo: "", descripcion: "", fechaInicio: "", fechaFin: "",
  hora: "", ubicacion: "", categoria: "institucional",
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

// ─── Modal crear evento (requiere seleccionar curso) ─────────────────────
function CreateEventoModal({ cursos, onClose, onSaved }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [cursoId, setCursoId] = useState(cursos.length === 1 ? cursos[0]._id : "");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!cursoId) { setError("Debes seleccionar un curso."); return; }
    if (!form.titulo.trim() || !form.fechaInicio) {
      setError("El título y la fecha de inicio son requeridos."); return;
    }
    setSaving(true);
    setError("");
    try {
      await eventosCreateSimple({
        titulo:      form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        fechaInicio: form.fechaInicio,
        fechaFin:    form.fechaFin || form.fechaInicio,
        hora:        form.hora,
        ubicacion:   form.ubicacion.trim(),
        categoria:   form.categoria,
        cursosIds:   [cursoId],
      });
      onSaved();
    } catch (err) {
      setError(err.message || "No se pudo crear el evento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="md" title="Nuevo evento" description="Crea un evento para un curso">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--color-error-hover)" }}>
            {error}
          </div>
        )}

        <div>
          <label style={lbl}>Curso *</label>
          <select style={inp} value={cursoId} onChange={e => setCursoId(e.target.value)}>
            <option value="">— Selecciona un curso —</option>
            {cursos.map(c => (
              <option key={c._id} value={c._id}>{c.nombre ?? c.name ?? c._id}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={lbl}>Título *</label>
          <input style={inp} value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Nombre del evento" />
        </div>

        <div>
          <label style={lbl}>Descripción</label>
          <textarea style={{ ...inp, resize: "vertical", minHeight: 72 }} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Descripción opcional" />
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
            {saving ? "Creando…" : "Crear evento"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal editar evento (el evento ya tiene cursoId) ────────────────────
function EditEventoModal({ evento, onClose, onSaved }) {
  const [form,   setForm]   = useState({
    titulo:      evento.titulo      ?? "",
    descripcion: evento.descripcion ?? "",
    fechaInicio: evento.fechaInicio ? evento.fechaInicio.slice(0, 10) : "",
    fechaFin:    evento.fechaFin    ? evento.fechaFin.slice(0, 10)    : "",
    hora:        evento.hora        ?? "",
    ubicacion:   evento.ubicacion   ?? "",
    categoria:   evento.categoria   ?? "institucional",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.fechaInicio) {
      setError("El título y la fecha de inicio son requeridos."); return;
    }
    setSaving(true);
    setError("");
    try {
      await eventosUpdateSimple(evento._id ?? evento.id, {
        titulo:      form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        fechaInicio: form.fechaInicio,
        fechaFin:    form.fechaFin || form.fechaInicio,
        hora:        form.hora,
        ubicacion:   form.ubicacion.trim(),
        categoria:   form.categoria,
      });
      onSaved();
    } catch (err) {
      setError(err.message || "No se pudo guardar el evento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="md" title="Editar evento" description="Modifica los datos del evento">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--color-error-hover)" }}>
            {error}
          </div>
        )}
        <div>
          <label style={lbl}>Título *</label>
          <input style={inp} value={form.titulo} onChange={e => set("titulo", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Descripción</label>
          <textarea style={{ ...inp, resize: "vertical", minHeight: 72 }} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} />
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
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function CalendarioPage() {
  const { user }  = useAuth();
  const canManage = usePermission(PERMISSIONS.CREATE_EVENTS);

  const [cursos,     setCursos]     = useState([]);
  const [items,      setItems]      = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvt,    setEditEvt]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const cursosRes  = await cursosGetMine({ limit: 50 });
      const cursosList = cursosRes?.cursos ?? [];
      setCursos(cursosList);

      let totalTareas = 0, totalEventos = 0, tareasVencidas = 0, eventosProximos = 0;
      const allItems  = [];

      await Promise.all(
        cursosList.map(async (c) => {
          try {
            const res     = await calendarioGetByCurso(c._id);
            const entries = res?.items ?? [];
            entries.forEach(item =>
              allItems.push({ ...item, cursoNombre: c.nombre ?? "Sin nombre" })
            );
            const st = res?.estadisticas;
            if (st) {
              totalTareas     += st.totalTareas     ?? 0;
              totalEventos    += st.totalEventos    ?? 0;
              tareasVencidas  += st.tareasVencidas  ?? 0;
              eventosProximos += st.eventosProximos ?? 0;
            }
          } catch { /* ignorar errores de cursos individuales */ }
        })
      );

      allItems.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setItems(allItems);
      setStats({ totalTareas, totalEventos, tareasVencidas, eventosProximos });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await eventosDelete(id);
    load();
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "rgba(12,106,196,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <CalendarDays size={20} style={{ color: "var(--color-primary)" }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text)" }}>
            Calendario
          </h1>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Retos y eventos de todos tus cursos
          </p>
        </div>
      </div>

      {error ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 16 }}>
            No se pudo cargar el calendario.
          </p>
          <Button onClick={load}>Reintentar</Button>
        </div>
      ) : (
        <CalendarWidget
          items={items}
          loading={loading}
          stats={stats}
          canManage={canManage}
          onRefresh={load}
          onCreateEvent={() => setCreateOpen(true)}
          onEditEvent={(item) => setEditEvt(item)}
          onDeleteEvent={handleDelete}
          title="Calendario"
        />
      )}

      {createOpen && (
        <CreateEventoModal
          cursos={cursos}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); load(); }}
        />
      )}

      {editEvt && (
        <EditEventoModal
          evento={editEvt}
          onClose={() => setEditEvt(null)}
          onSaved={() => { setEditEvt(null); load(); }}
        />
      )}
    </div>
  );
}
