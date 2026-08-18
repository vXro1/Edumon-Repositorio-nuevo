// src/features/foros/pages/ForoDetallePage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ArrowLeft, MessageCircle, Lock, Unlock, Heart,
  Reply, Send, Loader2, Paperclip, RefreshCw,
  X, FileText, ExternalLink, Globe,
} from "lucide-react";

import {
  forosGetById,
  forosCambiarEstado,
  mensajesForoGetByForo,
  mensajesForoCreate,
  mensajesForoToggleLike,
} from "@/features/foros/services/forosService";

import { useAuth }          from "@/features/auth/hooks/useAuth";
import { normalizeMensaje } from "@/lib/normalizers";
import { Toast, UserAvatar, Button } from "@/components";
import { IconBtn }          from "@/features/cursos/components/shared/ui";
import useUserStore         from "@/store/useUserStore";
import { humanizeError }    from "@/utils/humanizeError";

/* ─── Esqueleto de carga ─────────────────────────────────────── */
function Sk({ h = 14, w = "100%", r = 6 }) {
  return (
    <div
      className="animate-pulse"
      style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Sk h={36} w={36} r={10} />
        <Sk h={28} w={260} r={8} />
      </div>
      <Sk h={80} r={16} />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{ display: "flex", gap: 12, padding: "16px 20px", background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)" }}
        >
          <Sk h={38} w={38} r={99} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <Sk h={13} w={140} r={6} />
            <Sk h={13} w="80%" r={6} />
            <Sk h={13} w="60%" r={6} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Utilidades ────────────────────────────────────────────── */
function formatFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function NombreAutor({ autor }) {
  if (!autor) return (
    <span style={{ fontWeight: 700, fontSize: 13, color: "var(--color-text)" }}>Usuario</span>
  );
  const nombre = [autor.nombre, autor.apellido].filter(Boolean).join(" ") || "Usuario";
  const rolLabel = autor.rol === "docente" ? "Docente" : autor.rol === "admin" ? "Admin" : null;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--color-text)" }}>{nombre}</span>
      {rolLabel && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
          background: "rgba(99,102,241,0.10)", color: "#6366F1",
        }}>
          {rolLabel}
        </span>
      )}
    </span>
  );
}
function ArchivoChip({ archivo }) {
  const isPdf = archivo.tipoArchivo?.includes("pdf");

  return (
    <a
      href={archivo.url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 8,
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        fontSize: 11.5,
        color: "var(--color-text-muted)",
        textDecoration: "none",
        transition: "background 150ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--color-border)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--color-bg)";
      }}
    >
      {isPdf ? <FileText size={12} /> : <ExternalLink size={12} />}
      {archivo.nombreOriginal || archivo.nombre}
    </a>
  );
}

/* ─── Tarjeta de mensaje ─────────────────────────────────────── */
function MensajeCard({ mensaje, onLike, onReply, esRespuesta = false }) {
  const [hov, setHov] = useState(false);
  const liked = mensaje.yaLeDioLike;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        gap: 12,
        padding: esRespuesta ? "12px 16px" : "16px 20px",
        background: esRespuesta ? "var(--color-bg)" : "var(--color-surface)",
        borderRadius: esRespuesta ? 12 : 16,
        border: `1px solid ${hov ? "rgba(99,102,241,0.20)" : "var(--color-border)"}`,
        boxShadow: hov && !esRespuesta ? "var(--shadow-md)" : "var(--shadow-card)",
        transition: "all 180ms",
        marginLeft: esRespuesta ? 50 : 0,
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <UserAvatar user={mensaje.autor} size={esRespuesta ? 30 : 38} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <NombreAutor autor={mensaje.autor} />
          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            {formatFecha(mensaje.createdAt)}
          </span>
        </div>

        <p style={{
          fontSize: 13.5, color: "var(--color-text)", lineHeight: 1.6,
          margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {mensaje.contenido}
        </p>

        {mensaje.archivos?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {mensaje.archivos.map((a) => (
              <ArchivoChip key={a._id} archivo={a} />
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 4, marginTop: 10, alignItems: "center" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            style={{ color: liked ? "#E11D48" : "var(--color-text-muted)", gap: 4 }}
          >
            <Heart
              size={13}
              style={{ fill: liked ? "#E11D48" : "none", color: liked ? "#E11D48" : "var(--color-text-muted)" }}
            />
            {mensaje.likes?.length ?? 0}
          </Button>

          {!esRespuesta && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReply}
              style={{ color: "var(--color-text-muted)", gap: 4 }}
            >
              <Reply size={13} />
              Responder
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Compositor ────────────────────────────────────────────── */
function Composer({ texto, setTexto, archivos, setArchivos, sending, onSubmit, replyTo, onCancelReply, textareaRef, fileRef }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{
      background: "var(--color-surface)",
      borderRadius: 16,
      border: `1.5px solid ${focused ? "#6366F1" : "var(--color-border)"}`,
      boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.10)" : "var(--shadow-card)",
      transition: "border-color 150ms, box-shadow 150ms",
      overflow: "hidden",
      marginBottom: 24,
    }}>

      {replyTo && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          background: "rgba(99,102,241,0.06)",
          borderBottom: "1px solid var(--color-border)",
        }}>
          <Reply size={12} style={{ color: "#6366F1", flexShrink: 0 }} />
          <span style={{
            fontSize: 12, color: "var(--color-text-muted)", flex: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            Respondiendo a{" "}
            <strong>{replyTo.autor?.nombre || "Usuario"}</strong>:{" "}
            {replyTo.contenido?.slice(0, 60)}
            {replyTo.contenido?.length > 60 ? "…" : ""}
          </span>
          <IconBtn color="var(--color-text-muted)" onClick={onCancelReply}>
            <X size={12} />
          </IconBtn>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Escribe tu mensaje aquí…"
        rows={3}
        style={{
          width: "100%",
          padding: "14px 16px",
          fontSize: 13.5,
          color: "var(--color-text)",
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "vertical",
          fontFamily: "inherit",
          lineHeight: 1.6,
          boxSizing: "border-box",
        }}
      />

      {archivos.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 14px 10px" }}>
          {archivos.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 8px", borderRadius: 8,
                background: "var(--color-bg)", border: "1px solid var(--color-border)",
                fontSize: 11.5, color: "var(--color-text-muted)",
              }}
            >
              <FileText size={11} />
              {f.name}
              <button
                type="button"
                onClick={() => setArchivos((p) => p.filter((_, j) => j !== i))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-text-muted)", display: "flex" }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", borderTop: "1px solid var(--color-border)",
      }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileRef.current?.click()}
          style={{ color: "var(--color-text-muted)", gap: 5 }}
        >
          <Paperclip size={13} /> Adjuntar
        </Button>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf"
          style={{ display: "none" }}
          onChange={(e) => setArchivos((p) => [...p, ...Array.from(e.target.files)])}
        />

        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={sending || (!texto.trim() && archivos.length === 0)}
          style={{ gap: 6 }}
        >
          {sending
            ? <Loader2 size={14} style={{ animation: "edu-spin 0.6s linear infinite" }} />
            : <Send size={14} />
          }
          Publicar
        </Button>
      </div>
    </div>
  );
}

/* ─── Página ────────────────────────────────────────────────── */
export default function ForoDetallePage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const setUsers = useUserStore((s) => s.setUsers);

  const [foro,     setForo]     = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState({ msg: "", type: "success" });
  const [texto,    setTexto]    = useState("");
  const [archivos, setArchivos] = useState([]);
  const [sending,  setSending]  = useState(false);
  const [replyTo,  setReplyTo]  = useState(null);

  const fileRef     = useRef(null);
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

  useEffect(() => { load(); }, [load]);

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
    e?.preventDefault();
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

  if (loading) return <LoadingSkeleton />;

  if (!foro) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <MessageCircle
        size={40}
        style={{ color: "var(--color-text-muted)", margin: "0 auto 12px", display: "block" }}
      />
      <p style={{ color: "var(--color-text-muted)", marginBottom: 16 }}>Foro no encontrado.</p>
      <Button variant="primary" onClick={() => navigate("/foros")}>Volver a foros</Button>
    </div>
  );

  const abierto = foro.estado === "abierto";

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Cabecera ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <IconBtn color="var(--color-text-muted)" onClick={() => navigate("/foros")} title="Volver">
          <ArrowLeft size={17} />
        </IconBtn>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
              {foro.titulo}
            </h1>
            <span style={{
              padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700,
              background: abierto ? "rgba(22,163,74,0.10)" : "rgba(148,163,184,0.15)",
              color: abierto ? "var(--edu-green-600)" : "#64748B",
            }}>
              {abierto ? "Abierto" : "Cerrado"}
            </span>
            {foro.publico !== false && (
              <span style={{
                padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                background: "rgba(12,106,196,0.08)", color: "var(--color-primary)",
                display: "inline-flex", alignItems: "center", gap: 3,
              }}>
                <Globe size={9} /> Público
              </span>
            )}
          </div>
          {foro.descripcion && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
              {foro.descripcion}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <IconBtn color="var(--color-text-muted)" onClick={load} title="Actualizar">
            <RefreshCw size={14} />
          </IconBtn>
          <Button variant="outline" onClick={handleToggleEstado}>
            {abierto ? <Lock size={14} /> : <Unlock size={14} />}
            {abierto ? "Cerrar foro" : "Abrir foro"}
          </Button>
        </div>
      </div>

      {/* ── Composer / Cerrado ── */}
      {abierto ? (
        <Composer
          texto={texto}
          setTexto={setTexto}
          archivos={archivos}
          setArchivos={setArchivos}
          sending={sending}
          onSubmit={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          textareaRef={textareaRef}
          fileRef={fileRef}
        />
      ) : (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "16px 20px",
          background: "rgba(148,163,184,0.08)",
          borderRadius: 14,
          border: "1px solid var(--color-border)",
          marginBottom: 24,
          color: "var(--color-text-muted)",
          fontSize: 13.5,
        }}>
          <Lock size={14} />
          El foro está cerrado. No se pueden enviar nuevos mensajes.
        </div>
      )}

      {/* ── Mensajes ── */}
      {mensajes.length === 0 ? (
        <div style={{
          background: "var(--color-surface)", borderRadius: 16,
          border: "1px solid var(--color-border)", padding: "60px 24px", textAlign: "center",
        }}>
          <MessageCircle
            size={36}
            style={{ color: "var(--color-text-muted)", margin: "0 auto 12px", display: "block" }}
          />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", margin: "0 0 4px" }}>
            Sin mensajes aún
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-subtle)", margin: 0 }}>
            {abierto ? "Sé el primero en participar." : "El foro fue cerrado sin mensajes."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mensajes.map((m) => (
            <div key={m._id}>
              <MensajeCard
                mensaje={m}
                onLike={() => handleLike(m._id)}
                onReply={() => abierto && startReply(m)}
              />
              {m.respuestas?.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {m.respuestas.map((r) => (
                    <MensajeCard
                      key={r._id}
                      mensaje={r}
                      onLike={() => handleLike(r._id)}
                      onReply={() => {}}
                      esRespuesta
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}