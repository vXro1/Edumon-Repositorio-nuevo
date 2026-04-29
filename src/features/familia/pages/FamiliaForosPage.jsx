// src/features/familia/pages/FamiliaForosPage.jsx
// ROL: Padre / Tutor — Ver foros activos de sus cursos (lectura y escritura restringida)
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  MessageCircle, ArrowLeft, Lock, Heart, Reply,
  Send, Loader2, CheckCircle2, AlertCircle,
  Paperclip, ExternalLink, FileText, BookOpen, ChevronRight,
} from "lucide-react";
import {
  cursosGetMine, forosGetByCurso, forosGetById,
  mensajesForoGetByForo, mensajesForoCreate, mensajesForoToggleLike,
} from "@/lib/apiClient";
import { useAuth } from "@/features/auth/hooks/useAuth";

const AVATAR_COLORS = ["#0C6AC4","#6366F1","#16A34A","#D97706","#7C3AED","#0284C7"];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const cfg = {
    success: { bg: "rgba(22,163,74,0.12)", color: "#16A34A", border: "rgba(22,163,74,0.25)" },
    error:   { bg: "rgba(220,38,38,0.12)",  color: "#DC2626", border: "rgba(220,38,38,0.25)" },
  };
  const { bg, color, border } = cfg[type] || cfg.success;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 600,
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600,
      maxWidth: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {type === "success"
        ? <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0 }} />
        : <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

// ── ForoDetalle (vista inline del foro) ──────────────────────
function ForoDetalle({ foroId, onBack }) {
  const { user } = useAuth();
  const [foro,     setForo]     = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState({ msg: "", type: "success" });
  const [texto,    setTexto]    = useState("");
  const [replyTo,  setReplyTo]  = useState(null);
  const [sending,  setSending]  = useState(false);
  const [archivos, setArchivos] = useState([]);
  const fileRef    = useRef(null);
  const textareaRef = useRef(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [foroRes, mensajesRes] = await Promise.all([
        forosGetById(foroId),
        mensajesForoGetByForo(foroId),
      ]);
      setForo(foroRes.foro ?? foroRes);
      setMensajes(mensajesRes.mensajes ?? []);
    } catch {
      notify("Error al cargar el foro", "error");
    } finally {
      setLoading(false);
    }
  }, [foroId]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    if (!texto.trim() && archivos.length === 0) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("foroId", foroId);
      fd.append("contenido", texto.trim());
      if (replyTo) fd.append("respuestaA", replyTo._id);
      archivos.forEach(f => fd.append("archivos", f));
      await mensajesForoCreate(fd);
      setTexto("");
      setReplyTo(null);
      setArchivos([]);
      notify("Mensaje enviado");
      load();
    } catch (err) {
      notify(err.message || "Error al enviar", "error");
    } finally {
      setSending(false);
    }
  };

  const handleLike = async (msgId) => {
    try {
      await mensajesForoToggleLike(msgId);
      load();
    } catch { /* silencioso */ }
  };

  function MensajeCard({ msg, isReply = false }) {
    if (!msg) return null;
    const name = `${msg.autor?.nombre ?? ""} ${msg.autor?.apellido ?? ""}`.trim() || "Usuario";
    const initial = (name[0]?.toUpperCase()) ?? "?";
    const bg = avatarColor(name);
    const isMe = msg.autor?._id === (user?._id ?? user?.id);

    return (
      <div style={{
        display: "flex", gap: 10, marginBottom: isReply ? 8 : 16,
        paddingLeft: isReply ? 32 : 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: bg, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white",
        }}>
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{name}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {new Date(msg.creadoEn ?? msg.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--color-text)", margin: "5px 0 8px", lineHeight: 1.5 }}>
            {msg.contenido}
          </p>
          {/* Archivos del mensaje */}
          {msg.archivos?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {msg.archivos.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(12,106,196,0.08)", border: "1px solid rgba(12,106,196,0.2)",
                  borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#0C6AC4",
                  textDecoration: "none",
                }}>
                  <ExternalLink style={{ width: 11, height: 11 }} />
                  {a.nombre ?? "Archivo"}
                </a>
              ))}
            </div>
          )}
          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => handleLike(msg._id)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: msg.likes?.includes(user?._id) ? "#DC2626" : "var(--color-text-muted)",
                padding: 0,
              }}
            >
              <Heart style={{ width: 13, height: 13, fill: msg.likes?.includes(user?._id) ? "currentColor" : "none" }} />
              {msg.likes?.length ?? 0}
            </button>
            {!isReply && foro?.estado !== "cerrado" && (
              <button
                onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "var(--color-text-muted)", padding: 0,
                }}
              >
                <Reply style={{ width: 13, height: 13 }} />
                Responder
              </button>
            )}
          </div>
          {/* Respuestas anidadas */}
          {msg.respuestas?.length > 0 && (
            <div style={{ marginTop: 10, borderLeft: "2px solid var(--color-border)", paddingLeft: 12 }}>
              {msg.respuestas.map(r => (
                <MensajeCard key={r._id} msg={r} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Sk h={20} w="40%" />
        <div style={{ marginTop: 16 }}><Sk h={14} w="80%" /></div>
        <div style={{ marginTop: 8 }}><Sk h={14} w="60%" /></div>
      </div>
    );
  }

  return (
    <div>
      <Toast msg={toast.msg} type={toast.type} />
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13.5, fontWeight: 600, color: "var(--color-text-muted)",
          marginBottom: 18, padding: 0,
        }}
      >
        <ArrowLeft style={{ width: 15, height: 15 }} />
        Volver a foros
      </button>

      {/* Foro header */}
      <div style={{
        background: "var(--color-surface)", borderRadius: 16,
        border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
        padding: "18px 22px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
              {foro?.titulo}
            </h2>
            {foro?.descripcion && (
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 6 }}>
                {foro.descripcion}
              </p>
            )}
          </div>
          {foro?.estado === "cerrado" && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 12, fontWeight: 700, color: "#6B7280",
              background: "rgba(107,114,128,0.10)", borderRadius: 8, padding: "4px 10px",
              flexShrink: 0,
            }}>
              <Lock style={{ width: 12, height: 12 }} /> Cerrado
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        background: "var(--color-surface)", borderRadius: 16,
        border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
        padding: "18px 22px", marginBottom: 16,
        minHeight: 200,
      }}>
        {mensajes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
            <MessageCircle style={{ width: 32, height: 32, margin: "0 auto 10px", opacity: 0.4 }} />
            <p style={{ fontSize: 13.5, margin: 0 }}>Sé el primero en responder</p>
          </div>
        ) : (
          mensajes.map(m => <MensajeCard key={m._id} msg={m} />)
        )}
      </div>

      {/* Compose */}
      {foro?.estado !== "cerrado" && (
        <div style={{
          background: "var(--color-surface)", borderRadius: 16,
          border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
          padding: "16px 20px",
        }}>
          {replyTo && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(12,106,196,0.06)", borderRadius: 8, padding: "8px 12px",
              marginBottom: 10, fontSize: 12.5, color: "#0C6AC4",
            }}>
              <span>Respondiendo a <strong>{replyTo.autor?.nombre}</strong></span>
              <button
                onClick={() => setReplyTo(null)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <AlertCircle style={{ width: 13, height: 13 }} />
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Escribe tu mensaje…"
            rows={3}
            style={{
              width: "100%", padding: "10px 12px", fontSize: 13.5,
              borderRadius: 10, border: "1.5px solid var(--color-border)",
              background: "var(--color-bg)", color: "var(--color-text)",
              outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
            }}
            onFocus={e => (e.target.style.borderColor = "#0C6AC4")}
            onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <button
              type="button" onClick={() => fileRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "none", border: "1.5px dashed var(--color-border)",
                borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                fontSize: 12, color: "var(--color-text-muted)",
              }}
            >
              <Paperclip style={{ width: 12, height: 12 }} />
              Adjuntar {archivos.length > 0 && `(${archivos.length})`}
            </button>
            <input ref={fileRef} type="file" multiple style={{ display: "none" }}
              onChange={e => setArchivos(p => [...p, ...Array.from(e.target.files)])} />
            <button
              onClick={handleSend} disabled={sending || (!texto.trim() && archivos.length === 0)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: (sending || (!texto.trim() && archivos.length === 0)) ? "var(--color-border)" : "#0C6AC4",
                color: "white", border: "none", borderRadius: 8,
                padding: "8px 16px", fontSize: 13, fontWeight: 700,
                cursor: (sending || (!texto.trim() && archivos.length === 0)) ? "not-allowed" : "pointer",
              }}
            >
              {sending ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 13, height: 13 }} />}
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Foros list by course ──────────────────────────────────────
function ForoCard({ foro, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px", borderBottom: "1px solid var(--color-border)",
        cursor: "pointer", transition: "background 150ms",
        background: hov ? "var(--color-bg)" : "transparent",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: foro.estado === "cerrado" ? "rgba(107,114,128,0.10)" : "rgba(12,106,196,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {foro.estado === "cerrado"
          ? <Lock style={{ width: 15, height: 15, color: "#6B7280" }} />
          : <MessageCircle style={{ width: 15, height: 15, color: "#0C6AC4" }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 600, color: "var(--color-text)",
          margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {foro.titulo}
        </p>
        {foro.descripcion && (
          <p style={{
            fontSize: 12, color: "var(--color-text-muted)", marginTop: 3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {foro.descripcion}
          </p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {foro.estado === "cerrado" && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#6B7280",
            background: "rgba(107,114,128,0.10)", borderRadius: 99, padding: "2px 8px",
          }}>Cerrado</span>
        )}
        <ChevronRight style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function FamiliaForosPage() {
  const [cursos,    setCursos]    = useState([]);
  const [forosByCurso, setForosByCurso] = useState({});
  const [loading,   setLoading]   = useState(true);
  const [activeForo, setActiveForo] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await cursosGetMine({ limit: 50 });
        const lista = res.cursos ?? [];
        setCursos(lista);
        const forosMap = {};
        await Promise.all(lista.map(async (c) => {
          try {
            const fr = await forosGetByCurso(c._id);
            forosMap[c._id] = fr.foros ?? [];
          } catch {
            forosMap[c._id] = [];
          }
        }));
        setForosByCurso(forosMap);
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (activeForo) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <ForoDetalle foroId={activeForo} onBack={() => setActiveForo(null)} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: "rgba(12,106,196,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <MessageCircle style={{ width: 18, height: 18, color: "#0C6AC4" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Foros</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
            Participa en los foros de tus cursos
          </p>
        </div>
      </div>

      {loading ? (
        [0,1,2].map(i => (
          <div key={i} style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", padding: 20, marginBottom: 16 }}>
            <Sk h={16} w="30%" />
            <div style={{ marginTop: 12 }}>
              <Sk h={44} />
              <div style={{ marginTop: 8 }}><Sk h={44} /></div>
            </div>
          </div>
        ))
      ) : cursos.length === 0 ? (
        <div style={{
          background: "var(--color-surface)", borderRadius: 16,
          border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
          padding: "60px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <AlertCircle style={{ width: 36, height: 36, color: "var(--color-text-muted)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>
            No estás inscrito en ningún curso
          </p>
        </div>
      ) : (
        cursos.map(curso => {
          const foros = forosByCurso[curso._id] ?? [];
          if (foros.length === 0) return null;
          return (
            <div key={curso._id} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <BookOpen style={{ width: 14, height: 14, color: "var(--color-text-muted)" }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", margin: 0 }}>
                  {curso.nombre}
                </p>
              </div>
              <div style={{
                background: "var(--color-surface)", borderRadius: 16,
                border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)",
                overflow: "hidden",
              }}>
                {foros.map(f => (
                  <ForoCard key={f._id} foro={f} onClick={() => setActiveForo(f._id)} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}