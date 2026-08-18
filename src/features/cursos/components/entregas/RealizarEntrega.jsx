// src/features/cursos/components/entregas/RealizarEntrega.jsx
import { useState } from "react";
import { entregasCreate, entregasEnviar } from "@/features/entregas/services/entregasService";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { Button, FileUpload, Toast } from "@/components";
import { Field, StTextarea } from "../shared/ui";
import { makeNotify } from "../shared/helpers";
import { Send } from "lucide-react";
export default function RealizarEntrega({ tarea, onSuccess, onCancel }) {
  const { user }              = useAuthContext();
  const [texto, setTexto]     = useState("");
  const [archivos, setArchivos] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState({ msg: "", type: "success" });
  const notify                = makeNotify(setToast);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("tareaId", tarea._id);
    fd.append("padreId", user?._id ?? user?.id);
    fd.append("textoRespuesta", texto);
    archivos.forEach((f) => fd.append("archivos", f));
    return fd;
  };

  const handleDraft = async () => {
    setSaving(true);
    try {
      const fd = buildFormData();
      fd.append("estado", "borrador");
      await entregasCreate(fd);
      notify("Borrador guardado");
      setTimeout(onSuccess, 1200);
    } catch {
      notify("Error al guardar borrador", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!texto.trim() && archivos.length === 0) {
      notify("Escribe una respuesta o adjunta un archivo", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = buildFormData();
      fd.append("estado", "borrador");
      const res = await entregasCreate(fd);
      const id = res.entrega?._id ?? res._id;
      if (id) await entregasEnviar(id);
      notify("Entrega enviada");
      setTimeout(onSuccess, 1200);
    } catch {
      notify("Error al enviar entrega", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Toast {...toast} />

      <Field label="Tu respuesta">
        <StTextarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu respuesta aquí..."
          rows={5}
        />
      </Field>

      <Field label="Archivos adjuntos (opcional)">
        <FileUpload
          files={archivos}
          onChange={setArchivos}
          accept="image/*,.pdf,.doc,.docx,.xlsx,.ppt,.pptx"
          maxFiles={5}
          label="Arrastra o haz clic para adjuntar archivos"
        />
      </Field>

      <div className="modal-form-footer">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button variant="secondary" type="button" onClick={handleDraft} disabled={saving}>
          {saving ? "Guardando..." : "Guardar borrador"}
        </Button>
        <Button type="button" onClick={handleSend} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Send style={{ width: 13, height: 13 }} />
          {saving ? "Enviando..." : "Enviar entrega"}
        </Button>
      </div>
    </div>
  );
}
