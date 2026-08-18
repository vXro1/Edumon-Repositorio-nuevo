// src/features/cursos/components/entregas/CalificarEntrega.jsx
import { useState } from "react";
import { entregasCalificar } from "@/features/entregas/services/entregasService";
import { Button, Toast } from "@/components";
import { Field, InfoBlock, StTextarea, StarRatingInput } from "../shared/ui";
import { makeNotify } from "../shared/helpers";

export default function CalificarEntrega({ entrega, onSuccess, onCancel }) {
  const [gradeForm, setGradeForm] = useState({
    valoracion: entrega.calificacion?.valoracion ?? 0,
    comentario: entrega.calificacion?.comentario ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState({ msg: "", type: "success" });
  const notify = makeNotify(setToast);

  const autor  = typeof entrega.padre === "object" ? entrega.padre : null;
  const nombre = autor ? `${autor.nombre ?? ""} ${autor.apellido ?? ""}`.trim() : "Estudiante";

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!gradeForm.valoracion) { notify("Selecciona una valoración", "error"); return; }
    setSaving(true);
    try {
      await entregasCalificar(entrega._id, {
        valoracion: gradeForm.valoracion,
        comentario: gradeForm.comentario,
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
        <Field label="Valoración (1-5 estrellas) *">
          <StarRatingInput
            value={gradeForm.valoracion}
            onChange={(v) => setGradeForm((f) => ({ ...f, valoracion: v }))}
          />
        </Field>

        <Field label="Comentario">
          <StTextarea value={gradeForm.comentario}
            onChange={(e) => setGradeForm((f) => ({ ...f, comentario: e.target.value }))}
            placeholder="Retroalimentación al estudiante" rows={3} />
        </Field>

        <div className="modal-form-footer">
          <Button variant="ghost" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Calificar"}</Button>
        </div>
      </form>
    </div>
  );
}
