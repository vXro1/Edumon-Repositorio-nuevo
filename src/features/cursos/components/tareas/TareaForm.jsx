// src/features/cursos/components/tareas/TareaForm.jsx
import { useRef } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button, Input, Textarea, Checkbox } from "@/components";
import { Field, Sk } from "../shared/ui";
import { IconBtn } from "@/features/cursos/components/shared/ui";

export default function TareaForm({
  form, setForm,
  editTarget,
  participantesCurso, loadingParts,
  saving,
  onSubmit, onCancel,
}) {
  const fileRef = useRef(null);

  const toggleParticipante = (id) =>
    setForm((f) => ({
      ...f,
      participantes: f.participantes.includes(id)
        ? f.participantes.filter((p) => p !== id)
        : [...f.participantes, id],
    }));

  const toggleArchivoEliminar = (pid) =>
    setForm((f) => ({
      ...f,
      archivosEliminar: f.archivosEliminar.includes(pid)
        ? f.archivosEliminar.filter((p) => p !== pid)
        : [...f.archivosEliminar, pid],
    }));

  const handleFileAdd = (e) => {
    setForm((f) => ({
      ...f,
      archivosNuevos: [...f.archivosNuevos, ...Array.from(e.target.files ?? [])],
    }));
    e.target.value = "";
  };

  const removeArchivoNuevo = (i) =>
    setForm((f) => ({
      ...f,
      archivosNuevos: f.archivosNuevos.filter((_, idx) => idx !== i),
    }));

  const addEnlace = () =>
    setForm((f) => ({
      ...f,
      enlacesNuevos: [...f.enlacesNuevos, { url: "", nombre: "" }],
    }));

  const removeEnlace = (i) =>
    setForm((f) => ({
      ...f,
      enlacesNuevos: f.enlacesNuevos.filter((_, idx) => idx !== i),
    }));

  const updateEnlace = (i, field, value) =>
    setForm((f) => {
      const e = [...f.enlacesNuevos];
      e[i] = { ...e[i], [field]: value };
      return { ...f, enlacesNuevos: e };
    });

  const archivosExistentes = (editTarget?.archivosAdjuntos ?? []).filter(a => a.tipo === "archivo");
  const enlacesExistentes  = (editTarget?.archivosAdjuntos ?? []).filter(a => a.tipo === "enlace");

  return (
    <form onSubmit={onSubmit}>

      {/* ── Título ── */}
      <Input
        label="Título"
        name="titulo"
        value={form.titulo}
        onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
        placeholder="Nombre de la tarea"
        required
      />

      {/* ── Descripción ── */}
      <Textarea
        label="Descripción"
        name="descripcion"
        value={form.descripcion}
        onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
        rows={4}
      />

      {/* ── Fecha de entrega ── */}
      <Input
        label="Fecha de entrega"
        name="fechaEntrega"
        type="datetime-local"
        value={form.fechaEntrega}
        onChange={(e) => setForm(f => ({ ...f, fechaEntrega: e.target.value }))}
      />

      {/* ── Asignación — UI compleja, Field se mantiene ── */}
      <Field label="Asignar a">
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { value: "todos",         label: "🌐 Todos" },
            { value: "seleccionados", label: "👥 Seleccionados" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm(f => ({ ...f, asignacionTipo: value, participantes: [] }))}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 9,
                fontWeight: 700,
                border: "1.5px solid",
                borderColor: form.asignacionTipo === value ? "var(--color-primary)" : "var(--color-border)",
                background:  form.asignacionTipo === value ? "var(--color-primary-light)" : "var(--color-bg)",
                color:       form.asignacionTipo === value ? "var(--color-primary)" : "var(--color-text-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      {/* ── Participantes ── */}
      {form.asignacionTipo === "seleccionados" && (
        <Field label={`Participantes — ${form.participantes.length}`}>
          {loadingParts ? <Sk h={90} r={8} /> :
            participantesCurso.length === 0 ? (
              <p style={{ fontSize: 12.5 }}>Sin participantes</p>
            ) : (
              <div style={{
                maxHeight: 190, overflowY: "auto",
                border: "1.5px solid var(--color-border)", borderRadius: 9,
              }}>
                {participantesCurso.map(p => (
                  <div
                    key={p._id}
                    onClick={() => toggleParticipante(p._id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "7px 10px", cursor: "pointer",
                      background: form.participantes.includes(p._id)
                        ? "var(--color-primary-light)"
                        : "transparent",
                    }}
                  >
                    <Checkbox
                      checked={form.participantes.includes(p._id)}
                      onChange={() => toggleParticipante(p._id)}
                    />
                    <span style={{ flex: 1 }}>{p.nombre} {p.apellido}</span>
                  </div>
                ))}
              </div>
            )
          }
        </Field>
      )}

      {/* ── Archivos existentes ── */}
      {editTarget && archivosExistentes.length > 0 && (
        <Field label="Archivos existentes">
          {archivosExistentes.map((adj, i) => {
            const marcado = form.archivosEliminar.includes(adj.publicId);
            return (
              <div
                key={adj._id ?? i}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px",
                  border: "1.5px solid var(--color-border)", borderRadius: 8,
                }}
              >
                <FileText style={{ width: 14, height: 14 }} />
                <a href={adj.url} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
                  {adj.nombre}
                </a>
                <IconBtn
                  color={marcado ? "var(--color-error)" : "var(--color-text-muted)"}
                  onClick={() => toggleArchivoEliminar(adj.publicId)}
                >
                  <FileText style={{ width: 14, height: 14 }} />
                </IconBtn>
              </div>
            );
          })}
        </Field>
      )}

      {/* ── Nuevos archivos ── */}
      <Field label="Archivos">
        <input
          ref={fileRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileAdd}
        />

        <Button variant="outline" type="button" onClick={() => fileRef.current?.click()}>
          <Upload style={{ width: 14, height: 14 }} />
          Seleccionar archivos
        </Button>

        {form.archivosNuevos.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <FileText />
            <span style={{ flex: 1 }}>{f.name}</span>
            <IconBtn color="var(--color-error)" onClick={() => removeArchivoNuevo(i)}>
              <X />
            </IconBtn>
          </div>
        ))}
      </Field>

      {/* ── Enlaces ── */}
      <Field label="Enlaces">
        {form.enlacesNuevos.map((enlace, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <Input
              name={`enlace-url-${i}`}
              value={enlace.url}
              onChange={(e) => updateEnlace(i, "url", e.target.value)}
              placeholder="https://..."
            />
            <IconBtn color="var(--color-error)" onClick={() => removeEnlace(i)}>
              <X />
            </IconBtn>
          </div>
        ))}

        <Button variant="outline" type="button" onClick={addEnlace}>
          + Agregar enlace
        </Button>
      </Field>

      {/* ── Footer ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : editTarget ? "Guardar cambios" : "Crear tarea"}
        </Button>
      </div>

    </form>
  );
}