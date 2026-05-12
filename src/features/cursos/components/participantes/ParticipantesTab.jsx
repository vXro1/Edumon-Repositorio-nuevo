// src/features/cursos/components/participantes/ParticipantesTab.jsx
import { useState, useEffect, useCallback } from "react";
import { Users, UserMinus, Upload, UserPlus } from "lucide-react";
import {
  cursosGetParticipantes,
  cursosAddParticipante,
  cursosRemoveParticipante,
  cursosAddParticipantesCsv,
} from "@/lib/apiClient";
import { normalizeUser }from "@/lib/normalizers";
import { Badge, Button, Input, Modal, UserAvatar, Toast, CsvUploadModal } from "@/components";
import { Sk, EmptyState, Field, iconBtn } from "../shared/ui";
import { makeNotify } from "../shared/helpers";
import { descargarPlantillaPadresCSV, CSV_COLUMNAS_PADRES } from "@/components/ui/PadresCsvTemplate";

export default function ParticipantesTab({ cursoId, canManage }) {
  const [parts, setParts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [form, setForm]       = useState({ nombre: "", apellido: "", cedula: "", telefono: "" });
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState({ msg: "", type: "success" });
  const notify = makeNotify(setToast);

  // ── Carga ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cursosGetParticipantes(cursoId, { limit: 100 });
      setParts(
        (res.participantes ?? res.data ?? []).map((p) => ({
          ...p,
          usuario: normalizeUser(p.usuario ?? p),
        }))
      );
    } catch { setParts([]); }
    finally { setLoading(false); }
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  // ── Agregar individual ────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    const { nombre, apellido, cedula, telefono } = form;
    if (!nombre.trim() || !apellido.trim() || !cedula.trim() || !telefono.trim()) {
      notify("Todos los campos son requeridos", "error"); return;
    }
    setSaving(true);
    try {
      await cursosAddParticipante(cursoId, { ...form, contrasena: cedula });
      notify("Participante agregado");
      setAddOpen(false);
      setForm({ nombre: "", apellido: "", cedula: "", telefono: "" });
      load();
    } catch { notify("Error al agregar participante", "error"); }
    finally { setSaving(false); }
  };

  // ── Carga masiva CSV ──────────────────────────────────────────────────────
  const handleCsvUpload = async (file) => {
    const formData = new FormData();
    formData.append("archivoCSV", file);
    const res = await cursosAddParticipantesCsv(cursoId, formData);
    load(); // refresca lista aunque haya errores parciales
    return res; // { total, exitosos, fallidos, detalle[] } → lo muestra CsvUploadModal
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleRemove = async (userId) => {
    if (!confirm("¿Eliminar este participante?")) return;
    try {
      await cursosRemoveParticipante(cursoId, userId);
      notify("Participante eliminado");
      load();
    } catch { notify("Error al eliminar", "error"); }
  };

  return (
    <div>
      <Toast {...toast} />

      {/* ── Encabezado con los dos botones de acción ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10, marginBottom: 16,
      }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>
          Participantes ({parts.length})
        </h3>

        {canManage && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Botón: carga masiva CSV */}
            <button
              onClick={() => setCsvOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-primary, var(--color-text-info, #2563eb))",
                cursor: "pointer", transition: "background 0.15s",
              }}
            >
              <Upload style={{ width: 14, height: 14 }} />
              Carga masiva CSV
            </button>

            {/* Botón: agregar individual */}
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus style={{ width: 14, height: 14, marginRight: 6 }} />
              Agregar participante
            </Button>
          </div>
        )}
      </div>

      {/* ── Lista / skeleton / estado vacío ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2, 3].map((i) => <Sk key={i} h={56} r={12} />)}
        </div>
      ) : parts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin participantes"
          desc="Agrega el primer participante al curso."
          action={canManage ? { label: "Agregar", onClick: () => setAddOpen(true) } : null}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {parts.map((p) => {
            const u = p.usuario ?? p;
            const esDocente = p.etiqueta === "docente";
            return (
              <div
                key={u._id ?? p._id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 12,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <UserAvatar user={u} size={38} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                    {u.nombre} {u.apellido}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                    {p.etiqueta ?? u.rol}
                  </p>
                </div>
                {esDocente && (
                  <Badge variant="info" styleType="soft" size="sm">Docente</Badge>
                )}
                {canManage && !esDocente && (
                  <button
                    onClick={() => handleRemove(u._id ?? p._id)}
                    style={iconBtn("var(--color-error)")}
                  >
                    <UserMinus style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Modal 1 — Agregar participante individual
      ══════════════════════════════════════════════ */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Agregar participante"
        size="md"
      >
        <form onSubmit={handleAdd}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nombre *">
              <Input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                required
              />
            </Field>
            <Field label="Apellido *">
              <Input
                value={form.apellido}
                onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                required
              />
            </Field>
            <Field label="Cédula *">
              <Input
                value={form.cedula}
                onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))}
                required
              />
            </Field>
            <Field label="Teléfono *">
              <Input
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                required
              />
            </Field>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "4px 0 16px" }}>
            Si el padre no existe, se creará con contraseña igual a su cédula.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" type="button" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════
          Modal 2 — Carga masiva CSV
      ══════════════════════════════════════════════ */}
      <CsvUploadModal
        isOpen={csvOpen}
        onClose={() => setCsvOpen(false)}
        onUpload={handleCsvUpload}
        onDownloadTemplate={descargarPlantillaPadresCSV}
        title="Carga masiva de padres de familia"
        description="Sube un CSV con los datos de los padres. Si el usuario ya existe por cédula, se agrega directamente sin crear cuenta nueva."
        templateLabel="Descargar plantilla"
        acceptedColumns={CSV_COLUMNAS_PADRES}
        maxFileSizeMB={5}
      />
    </div>
  );
}