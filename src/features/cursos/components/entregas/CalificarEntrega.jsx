// src/features/cursos/components/entregas/CalificarEntrega.jsx
import { useState } from "react";
import { entregasCalificar } from "@/lib/apiClient";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { Button, Input, Toast } from "@/components";
import { Field, InfoBlock, StTextarea } from "../shared/ui";
import { makeNotify } from "../shared/helpers";

export default function CalificarEntrega({ entrega, onSuccess, onCancel }) {
  const { user } = useAuthContext();
  const [gradeForm, setGradeForm] = useState({
    nota: entrega.calificacion?.nota ?? "",
    comentario: entrega.calificacion?.comentario ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState({ msg: "", type: "success" });
  const notify = makeNotify(setToast);

  const autor  = typeof entrega.padre === "object" ? entrega.padre : null;
  const nombre = autor ? `${autor.nombre ?? ""} ${autor.apellido ?? ""}`.trim() : "Estudiante";

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!gradeForm.nota) { notify("Ingresa una nota", "error"); return; }
    setSaving(true);
    try {
      await entregasCalificar(entrega._id, {
        ...gradeForm,
        docenteId: user?._id ?? user?.id,
      });
      onSuccess();
    } catch {
      notify("Error al calificar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Toast {...toast} />

      <InfoBlock label="Entrega de">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{nombre}</p>
      </InfoBlock>

      {entrega.textoRespuesta && (
        <InfoBlock label="Respuesta">
          <p style={{ fontSize: 12.5, color: "var(--color-text)", margin: 0, whiteSpace: "pre-wrap" }}>
            {entrega.textoRespuesta}
          </p>
        </InfoBlock>
      )}

      <form onSubmit={handleGrade} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nota (0-10) *">
          <Input type="number" min="0" max="10" step="0.1"
            value={gradeForm.nota}
            onChange={(e) => setGradeForm((f) => ({ ...f, nota: e.target.value }))}
            placeholder="Ej: 8.5" required />
        </Field>

        <Field label="Comentario">
          <StTextarea value={gradeForm.comentario}
            onChange={(e) => setGradeForm((f) => ({ ...f, comentario: e.target.value }))}
            placeholder="Retroalimentación al estudiante" rows={3} />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10,
          paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
          <Button variant="ghost" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Calificar"}</Button>
        </div>
      </form>
    </div>
  );
}