import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ArrowLeft, MessageCircle, Lock, Unlock, Heart,
  Reply, Send, Loader2, CheckCircle2, AlertCircle,
  Paperclip, ExternalLink, FileText, RefreshCw, X,
} from "lucide-react";

import {
  forosGetById,
  forosCambiarEstado,
  mensajesForoGetByForo,
  mensajesForoCreate,
  mensajesForoToggleLike,
} from "@/lib/apiClient";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { normalizeMensaje } from "@/lib/normalizers";
import { Toast, UserAvatar, Button } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";
import useUserStore from "@/store/useUserStore";
import { humanizeError } from "@/utils/humanizeError";

function Sk({ h = 14, w = "100%", r = 6 }) {
  return (
    <div
      className="animate-pulse"
      style={{
        height: h,
        width: w,
        borderRadius: r,
        background: "var(--color-border)",
      }}
    />
  );
}

export default function ForoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const setUsers = useUserStore((s) => s.setUsers);

  const [foro, setForo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const [texto, setTexto] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [foroData, mensajesData] = await Promise.all([
        forosGetById(id),
        mensajesForoGetByForo(id),
      ]);

      setForo(foroData.foro ?? foroData);

      const normalized = (mensajesData.mensajes ?? []).map(normalizeMensaje);
      setMensajes(normalized);

      const autores = [];
      normalized.forEach((m) => {
        if (m.autor?._id) autores.push(m.autor);
        (m.respuestas ?? []).forEach((r) => {
          if (r.autor?._id) autores.push(r.autor);
        });
      });

      setUsers(autores);
    } catch {
      notify("Error al cargar el foro", "error");
    } finally {
      setLoading(false);
    }
  }, [id, setUsers]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleEstado = async () => {
    if (!foro) return;

    const nuevoEstado = foro.estado === "abierto" ? "cerrado" : "abierto";

    try {
      await forosCambiarEstado(id, { estado: nuevoEstado });
      setForo((p) => ({ ...p, estado: nuevoEstado }));
      notify(`Foro ${nuevoEstado}`);
    } catch (err) {
      notify(humanizeError(err, "Error al cambiar estado"), "error");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!texto.trim() && archivos.length === 0) return;

    setSending(true);
    try {
      const fd = new FormData();
      fd.append("foroId", id);
      fd.append("contenido", texto.trim());
      if (replyTo) fd.append("respuestaA", replyTo._id);
      archivos.forEach((f) => fd.append("archivos", f));

      await mensajesForoCreate(fd);

      setTexto("");
      setArchivos([]);
      setReplyTo(null);
      load();
    } catch (err) {
      notify(humanizeError(err, "Error al enviar mensaje"), "error");
    } finally {
      setSending(false);
    }
  };

  const handleLike = async (mensajeId) => {
    try {
      const data = await mensajesForoToggleLike(mensajeId);

      setMensajes((prev) =>
        prev.map((m) => {
          if (m._id === mensajeId)
            return { ...m, likes: data.likes, yaLeDioLike: data.yaLeDioLike };

          return {
            ...m,
            respuestas: (m.respuestas ?? []).map((r) =>
              r._id === mensajeId
                ? { ...r, likes: data.likes, yaLeDioLike: data.yaLeDioLike }
                : r
            ),
          };
        })
      );
    } catch {}
  };

  const startReply = (mensaje) => {
    setReplyTo(mensaje);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  if (loading)
    return (
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <Sk h={36} w={36} r={99} />
      </div>
    );

  if (!foro)
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p style={{ color: "var(--color-text-muted)" }}>Foro no encontrado.</p>

        <Button onClick={() => navigate("/foros")} variant="primary">
          Volver
        </Button>
      </div>
    );

  const abierto = foro.estado === "abierto";

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* HEADER */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        <IconBtn color="var(--color-text-muted)" onClick={() => navigate("/foros")}>
          <ArrowLeft size={17} />
        </IconBtn>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>{foro.titulo}</h1>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <IconBtn color="var(--color-text-muted)" onClick={load}>
            <RefreshCw size={14} />
          </IconBtn>

          <Button variant="outline" onClick={handleToggleEstado}>
            {abierto ? <Lock size={14} /> : <Unlock size={14} />}
            {abierto ? "Cerrar foro" : "Abrir foro"}
          </Button>
        </div>
      </div>

      {/* COMPOSER */}
      {abierto ? (
        <div>
          <form onSubmit={handleSend}>
            <textarea
              ref={textareaRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip size={13} /> Adjuntar
              </Button>

              <Button type="submit" disabled={sending}>
                {sending ? <Loader2 size={15} /> : <Send size={14} />}
                Publicar
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <Lock size={15} />
          <p>El foro está cerrado</p>
        </div>
      )}
    </div>
  );
}

/* Mensajes */
function MensajeCard({ mensaje, onLike, onReply, onLikeReply }) {
  const liked = mensaje.yaLeDioLike;

  return (
    <div>
      <UserAvatar user={mensaje.autor} size={34} />

      <p>{mensaje.contenido}</p>

      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="ghost" onClick={onLike}>
          <Heart size={13} /> {mensaje.likes?.length ?? 0}
        </Button>

        <Button variant="ghost" onClick={onReply}>
          <Reply size={13} /> Responder
        </Button>
      </div>
    </div>
  );
}