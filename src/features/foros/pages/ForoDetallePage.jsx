// src/features/foros/pages/ForoDetallePage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MessageCircle, Lock, Unlock, Heart,
  Reply, Send, Loader2, CheckCircle2, AlertCircle,
  Paperclip, ExternalLink, FileText, RefreshCw, X,
} from "lucide-react";
import {
  forosGetById, forosCambiarEstado,
  mensajesForoGetByForo, mensajesForoCreate, mensajesForoToggleLike,
} from "@/lib/apiClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { normalizeMensaje } from "@/lib/normalizers";
import UserAvatar from "@/components/ui/UserAvatar";
import useUserStore from "@/store/useUserStore";
import { humanizeError } from "@/utils/humanizeError";

function Toast({ msg, type }) {
  if (!msg) return null;
  const cfg = {
    success: { bg: "rgba(22,163,74,0.12)", color: "#16A34A", border: "rgba(22,163,74,0.25)" },
    error:   { bg: "rgba(220,38,38,0.12)",  color: "#DC2626", border: "rgba(220,38,38,0.25)" },
  };
  const { bg, color, border } = cfg[type] || cfg.success;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 600, background: bg, color, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600, maxWidth: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8 }}>
      {type === "success" ? <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0 }} /> : <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}


export default function ForoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const setUsers = useUserStore((s) => s.setUsers);

  const [foro,      setForo]      = useState(null);
  const [mensajes,  setMensajes]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState({ msg: "", type: "success" });

  // Message compose
  const [texto,     setTexto]     = useState("");
  const [archivos,  setArchivos]  = useState([]);
  const [sending,   setSending]   = useState(false);
  const [replyTo,   setReplyTo]   = useState(null);
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
      // Seed all unique message authors into the global user cache
      const autores = [];
      normalized.forEach(m => {
        if (m.autor?._id) autores.push(m.autor);
        (m.respuestas ?? []).forEach(r => { if (r.autor?._id) autores.push(r.autor); });
      });
      setUsers(autores);
    } catch {
      notify("Error al cargar el foro", "error");
    } finally {
      setLoading(false);
    }
  }, [id, setUsers]);

  useEffect(() => { load(); }, [load]);

  const handleToggleEstado = async () => {
    if (!foro) return;
    const nuevoEstado = foro.estado === "abierto" ? "cerrado" : "abierto";
    try {
      await forosCambiarEstado(id, { estado: nuevoEstado });
      setForo(p => ({ ...p, estado: nuevoEstado }));
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
      archivos.forEach(file => fd.append("archivos", file));
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
      setMensajes(prev =>
        prev.map(m => {
          if (m._id === mensajeId) return { ...m, likes: data.likes, yaLeDioLike: data.yaLeDioLike };
          return {
            ...m,
            respuestas: (m.respuestas ?? []).map(r =>
              r._id === mensajeId ? { ...r, likes: data.likes, yaLeDioLike: data.yaLeDioLike } : r
            ),
          };
        })
      );
    } catch { /* silencioso */ }
  };

  const startReply = (mensaje) => {
    setReplyTo(mensaje);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  if (loading) return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Sk h={36} w={36} r={99} /><div style={{ flex: 1 }}><Sk h={22} w="55%" /><div style={{ marginTop: 8 }}><Sk h={13} w="40%" /></div></div>
      </div>
      {[0,1,2].map(i => <div key={i} style={{ marginBottom: 12 }}><Sk h={110} r={16} /></div>)}
    </div>
  );

  if (!foro) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <p style={{ color: "var(--color-text-muted)" }}>Foro no encontrado.</p>
      <button onClick={() => navigate("/foros")} style={{ marginTop: 16, padding: "9px 20px", borderRadius: 10, border: "none", background: "#0C6AC4", color: "white", fontWeight: 600, cursor: "pointer" }}>Volver</button>
    </div>
  );

  const abierto = foro.estado === "abierto";
  const cursoNombre = foro.curso?.nombre ?? "";

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <button onClick={() => navigate("/foros")} style={{ padding: 8, borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)", flexShrink: 0, marginTop: 4 }}>
          <ArrowLeft style={{ width: 17, height: 17 }} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>{foro.titulo}</h1>
            <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: abierto ? "rgba(22,163,74,0.10)" : "rgba(148,163,184,0.15)", color: abierto ? "#16A34A" : "#64748B" }}>
              {abierto ? "Abierto" : "Cerrado"}
            </span>
          </div>
          {foro.descripcion && <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>{foro.descripcion}</p>}
          {cursoNombre && <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>Curso: {cursoNombre}</p>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} title="Actualizar" style={{ padding: 8, borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>
          <button onClick={handleToggleEstado} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)" }}>
            {abierto ? <Lock style={{ width: 14, height: 14 }} /> : <Unlock style={{ width: 14, height: 14 }} />}
            {abierto ? "Cerrar foro" : "Abrir foro"}
          </button>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {mensajes.length === 0 ? (
          <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", padding: "52px 24px", textAlign: "center" }}>
            <MessageCircle style={{ width: 32, height: 32, color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)" }}>Sin mensajes todavía</p>
            <p style={{ fontSize: 13, color: "var(--color-text-subtle)" }}>Sé el primero en publicar</p>
          </div>
        ) : (
          mensajes.map(mensaje => (
            <MensajeCard
              key={mensaje._id}
              mensaje={mensaje}
              currentUserId={user?._id}
              onLike={() => handleLike(mensaje._id)}
              onReply={() => startReply(mensaje)}
              onLikeReply={(rid) => handleLike(rid)}
            />
          ))
        )}
      </div>

      {/* ── Compose ────────────────────────────────────────────── */}
      {abierto ? (
        <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", padding: "16px 20px", position: "sticky", bottom: 16 }}>
          {replyTo && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(12,106,196,0.06)", borderRadius: 8, padding: "6px 12px", marginBottom: 10 }}>
              <Reply style={{ width: 13, height: 13, color: "#0C6AC4", flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, color: "#0C6AC4", fontWeight: 600, flex: 1, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Respondiendo a {replyTo.autor?.nombre ?? "mensaje"}
              </p>
              <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0C6AC4", display: "flex", padding: 2 }}><X style={{ width: 12, height: 12 }} /></button>
            </div>
          )}
          <form onSubmit={handleSend}>
            <textarea
              ref={textareaRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder={replyTo ? "Escribe tu respuesta..." : "Escribe un mensaje..."}
              rows={3}
              style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 10, border: "1.5px solid var(--color-border)", outline: "none", background: "var(--color-bg)", color: "var(--color-text)", resize: "vertical", transition: "border-color 150ms", boxSizing: "border-box" }}
              onFocus={e => { e.target.style.borderColor = "#0C6AC4"; e.target.style.boxShadow = "0 0 0 3px rgba(12,106,196,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--color-border)"; e.target.style.boxShadow = "none"; }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button type="button" onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--color-border)", background: "var(--color-bg)", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "var(--color-text-muted)" }}>
                  <Paperclip style={{ width: 13, height: 13 }} /> Adjuntar
                </button>
                {archivos.length > 0 && <span style={{ fontSize: 12, color: "#0C6AC4", fontWeight: 600 }}>{archivos.length} archivo{archivos.length > 1 ? "s" : ""}</span>}
                <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={e => setArchivos(Array.from(e.target.files))} />
              </div>
              <button type="submit" disabled={sending || (!texto.trim() && archivos.length === 0)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 10, border: "none", background: (sending || (!texto.trim() && archivos.length === 0)) ? "#6ba4d8" : "#0C6AC4", color: "white", fontWeight: 600, fontSize: 13.5, cursor: (sending || (!texto.trim() && archivos.length === 0)) ? "not-allowed" : "pointer" }}>
                {sending ? <Loader2 style={{ width: 15, height: 15, animation: "edu-spin 0.6s linear infinite" }} /> : <Send style={{ width: 14, height: 14 }} />}
                Publicar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ background: "rgba(148,163,184,0.10)", borderRadius: 14, border: "1px solid var(--color-border)", padding: "16px 20px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Lock style={{ width: 15, height: 15, color: "var(--color-text-muted)" }} />
          <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: 0, fontWeight: 500 }}>El foro está cerrado — no se pueden publicar nuevos mensajes</p>
        </div>
      )}
    </div>
  );
}

function MensajeCard({ mensaje, currentUserId, onLike, onReply, onLikeReply }) {
  const autorNombre = `${mensaje.autor.nombre} ${mensaje.autor.apellido}`.trim() || "Sin nombre";
  const liked = mensaje.yaLeDioLike;
  const likeCount = mensaje.likes?.length ?? 0;
  const adjuntos = mensaje.archivos ?? [];
  const fecha = mensaje.createdAt ? new Date(mensaje.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px" }}>
        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <UserAvatar user={mensaje.autor} size={34} />
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{autorNombre}</p>
            <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", margin: 0 }}>{fecha}</p>
          </div>
        </div>

        {/* Content */}
        <p style={{ fontSize: 13.5, color: "var(--color-text)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{mensaje.contenido}</p>

        {/* Attachments */}
        {adjuntos.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {adjuntos.map((a, i) => (
              <a key={i} href={a.url ?? a} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 12, color: "#0C6AC4", fontWeight: 600, textDecoration: "none" }}>
                <FileText style={{ width: 12, height: 12 }} />
                {a.nombre ?? a.originalname ?? `Archivo ${i + 1}`}
                <ExternalLink style={{ width: 10, height: 10 }} />
              </a>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={onLike} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "none", background: liked ? "rgba(220,38,38,0.10)" : "var(--color-bg)", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: liked ? "#DC2626" : "var(--color-text-muted)", transition: "all 120ms" }}>
            <Heart style={{ width: 13, height: 13, fill: liked ? "#DC2626" : "none" }} />
            {likeCount > 0 && likeCount}
          </button>
          <button onClick={onReply} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "none", background: "var(--color-bg)", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "var(--color-text-muted)" }}>
            <Reply style={{ width: 13, height: 13 }} /> Responder
          </button>
        </div>
      </div>

      {/* Replies */}
      {(mensaje.respuestas ?? []).length > 0 && (
        <div style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-bg)", padding: "0 18px" }}>
          {mensaje.respuestas.map(r => (
            <RespuestaCard key={r._id} respuesta={r} onLike={() => onLikeReply(r._id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RespuestaCard({ respuesta: r, onLike }) {
  const autorNombre = `${r.autor.nombre} ${r.autor.apellido}`.trim() || "Sin nombre";
  const liked = r.yaLeDioLike;
  const likeCount = r.likes?.length ?? 0;
  const fecha = r.createdAt ? new Date(r.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div style={{ paddingTop: 12, paddingBottom: 12, borderBottom: "1px solid var(--color-border)", display: "flex", gap: 10 }}>
      <div style={{ width: 2, background: "var(--color-border)", borderRadius: 99, flexShrink: 0, marginLeft: 4 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <UserAvatar user={r.autor} size={26} />
          <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{autorNombre}</p>
          <p style={{ fontSize: 11.5, color: "var(--color-text-muted)", margin: 0 }}>{fecha}</p>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>{r.contenido}</p>
        <button onClick={onLike} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7, border: "none", background: liked ? "rgba(220,38,38,0.08)" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, color: liked ? "#DC2626" : "var(--color-text-muted)" }}>
          <Heart style={{ width: 12, height: 12, fill: liked ? "#DC2626" : "none" }} />
          {likeCount > 0 && likeCount}
        </button>
      </div>
    </div>
  );
}
