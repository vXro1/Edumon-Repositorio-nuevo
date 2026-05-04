// src/features/cursos/components/participantes/ParticipantesTab.jsx
import { useState, useEffect, useCallback } from "react";
import { Users, UserMinus } from "lucide-react";
import { cursosGetParticipantes, cursosAddParticipante, cursosRemoveParticipante } from "@/lib/apiClient";
import { normalizeUser } from "@/lib/normalizers";
import { Badge, Button, Input, Modal, UserAvatar, Toast } from "@/components";
import { Sk, EmptyState, SectionHeader, Field, iconBtn } from "../shared/ui";
import { makeNotify } from "../shared/helpers";

export default function ParticipantesTab({ cursoId, canManage }) {
  const [parts, setParts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [addOpen, setAddOpen]     = useState(false);
  const [form, setForm]           = useState({ nombre: "", apellido: "", cedula: "", telefono: "" });
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState({ msg: "", type: "success" });
  const notify = makeNotify(setToast);

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

  const handleRemove = async (userId) => {
    if (!confirm("¿Eliminar este participante?")) return;
    try { await cursosRemoveParticipante(cursoId, userId); notify("Participante eliminado"); load(); }
    catch { notify("Error al eliminar", "error"); }
  };

  return (
    <div>
      <Toast {...toast} />
      <SectionHeader
        title={`Participantes (${parts.length})`}
        action={canManage ? { label: "Agregar participante", onClick: () => setAddOpen(true) } : null}
      />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2, 3].map((i) => <Sk key={i} h={56} r={12} />)}
        </div>
      ) : parts.length === 0 ? (
        <EmptyState icon={Users} title="Sin participantes"
          desc="Agrega el primer participante al curso."
          action={canManage ? { label: "Agregar", onClick: () => setAddOpen(true) } : null} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {parts.map((p) => {
            const u = p.usuario ?? p;
            const esDocente = p.etiqueta === "docente";
            return (
              <div key={u._id ?? p._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                borderRadius: 12, background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <UserAvatar user={u} size={38} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                    {u.nombre} {u.apellido}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                    {p.etiqueta ?? u.rol}
                  </p>
                </div>
                {esDocente && <Badge variant="info" styleType="soft" size="sm">Docente</Badge>}
                {canManage && !esDocente && (
                  <button onClick={() => handleRemove(u._id ?? p._id)} style={iconBtn("var(--color-error)")}>
                    <UserMinus style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Agregar participante" size="md">
        <form onSubmit={handleAdd}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nombre *">
              <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required />
            </Field>
            <Field label="Apellido *">
              <Input value={form.apellido} onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))} required />
            </Field>
            <Field label="Cédula *">
              <Input value={form.cedula} onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))} required />
            </Field>
            <Field label="Teléfono *">
              <Input value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} required />
            </Field>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "4px 0 16px" }}>
            Si el padre no existe, se creará con contraseña igual a su cédula.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" type="button" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Agregando..." : "Agregar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}