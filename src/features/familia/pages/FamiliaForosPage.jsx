import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import {
  MessageCircle, ArrowLeft, Lock, Heart, Reply,
  Send, Loader2, CheckCircle2, AlertCircle,
  Paperclip, ExternalLink, FileText, BookOpen, ChevronRight,
} from "lucide-react";

import {
  cursosGetMine,
  forosGetByCurso,
  forosGetById,
  mensajesForoGetByForo,
  mensajesForoCreate,
  mensajesForoToggleLike,
} from "@/lib/apiClient";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { normalizeCurso, normalizeMensaje }from "@/lib/normalizers";
import { Toast, UserAvatar, Button } from "@/components";
import { IconBtn } from "@/features/cursos/components/shared/ui";
import { humanizeError } from "@/utils/humanizeError";
import useUserStore from "@/store/useUserStore";

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

// ── ForoDetalle ──────────────────────────────────────────────
function ForoDetalle({ foroId, onBack }) {
  const { user } = useAuth();
  const setUsers = useUserStore((s) => s.setUsers);

  const [foro, setForo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [texto, setTexto] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const fileRef = useRef(null);
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

      const normalized = (mensajesRes.mensajes ?? []).map(normalizeMensaje);
      setMensajes(normalized);

      const autores = [];
      normalized.forEach(m => {
        if (m.autor?._id) autores.push(m.autor);
        (m.respuestas ?? []).forEach(r => {
          if (r.autor?._id) autores.push(r.autor);
        });
      });

      setUsers(autores);
    } catch {
      notify("Error al cargar el foro", "error");
    } finally {
      setLoading(false);
    }
  }, [foroId, setUsers]);

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
      notify(humanizeError(err, "Error al enviar mensaje"), "error");
    } finally {
      setSending(false);
    }
  };

  const handleLike = async (msgId) => {
    try {
      await mensajesForoToggleLike(msgId);
      load();
    } catch {}
  };

  function MensajeCard({ msg, isReply = false }) {
    if (!msg) return null;

    const name =
      `${msg.autor?.nombre ?? ""} ${msg.autor?.apellido ?? ""}`.trim() || "Usuario";

    const liked = msg.likes?.includes(user?._id);

    return (
      <div style={{
        display: "flex",
        gap: 10,
        marginBottom: isReply ? 8 : 16,
        paddingLeft: isReply ? 32 : 0,
      }}>
        <UserAvatar user={msg.autor} size={32} />

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {new Date(msg.creadoEn ?? msg.createdAt).toLocaleString("es-CO")}
            </span>
          </div>

          <p style={{ fontSize: 13.5, margin: "5px 0 8px" }}>
            {msg.contenido}
          </p>

          {msg.archivos?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {msg.archivos.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer"
                   style={{
                     display: "flex",
                     alignItems: "center",
                     gap: 4,
                     fontSize: 12,
                     color: "#0C6AC4",
                     textDecoration: "none",
                   }}>
                  <ExternalLink style={{ width: 11, height: 11 }} />
                  {a.nombre ?? "Archivo"}
                </a>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

            <IconBtn
              color={liked ? "#DC2626" : "var(--color-text-muted)"}
              onClick={() => handleLike(msg._id)}
            >
              <Heart
                style={{ width: 13, height: 13 }}
                fill={liked ? "currentColor" : "none"}
              />
            </IconBtn>

            {!isReply && foro?.estado !== "cerrado" && (
              <Button
                variant="ghost"
                onClick={() => {
                  setReplyTo(msg);
                  textareaRef.current?.focus();
                }}
              >
                <Reply style={{ width: 13, height: 13 }} />
                Responder
              </Button>
            )}
          </div>

          {msg.respuestas?.length > 0 && (
            <div style={{
              marginTop: 10,
              borderLeft: "2px solid var(--color-border)",
              paddingLeft: 12,
            }}>
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
      </div>
    );
  }

  return (
    <div>

      <Toast msg={toast.msg} type={toast.type} />

      {/* BACK */}
      <Button variant="ghost" onClick={onBack} style={{ marginBottom: 18 }}>
        <ArrowLeft style={{ width: 15, height: 15 }} />
        Volver a foros
      </Button>

      {/* HEADER */}
      <div style={{ padding: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>{foro?.titulo}</h2>
        <p style={{ fontSize: 13 }}>{foro?.descripcion}</p>

        {foro?.estado === "cerrado" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Lock style={{ width: 12, height: 12 }} />
            Cerrado
          </div>
        )}
      </div>

      {/* MESSAGES */}
      <div style={{ padding: 18 }}>
        {mensajes.map(m => <MensajeCard key={m._id} msg={m} />)}
      </div>

      {/* COMPOSE */}
      {foro?.estado !== "cerrado" && (
        <div style={{ padding: 18 }}>

          {replyTo && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}>
              <span>Respondiendo a <b>{replyTo.autor?.nombre}</b></span>

              <IconBtn
                color="#DC2626"
                onClick={() => setReplyTo(null)}
              >
                <AlertCircle style={{ width: 13, height: 13 }} />
              </IconBtn>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={3}
            style={{ width: "100%" }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>

            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip style={{ width: 12, height: 12 }} />
              Adjuntar {archivos.length > 0 && `(${archivos.length})`}
            </Button>

            <input
              ref={fileRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={e => setArchivos(p => [...p, ...Array.from(e.target.files)])}
            />

            <Button
              variant="primary"
              onClick={handleSend}
              disabled={sending || (!texto.trim() && archivos.length === 0)}
            >
              {sending ? (
                <Loader2 style={{ width: 13, height: 13 }} />
              ) : (
                <Send style={{ width: 13, height: 13 }} />
              )}
              Enviar
            </Button>

          </div>
        </div>
      )}
    </div>
  );
}

// ── LISTA FOROS ──────────────────────────────────────────────
function ForoCard({ foro, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderBottom: "1px solid var(--color-border)",
        cursor: "pointer",
      }}
    >
      <div style={{ width: 38, height: 38 }}>
        {foro.estado === "cerrado"
          ? <Lock />
          : <MessageCircle />
        }
      </div>

      <div style={{ flex: 1 }}>
        <p>{foro.titulo}</p>
        <p>{foro.descripcion}</p>
      </div>

      {foro.estado === "cerrado" && (
        <span>Cerrado</span>
      )}
    </div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────
export default function FamiliaForosPage() {
  const [cursos, setCursos] = useState([]);
  const [forosByCurso, setForosByCurso] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeForo, setActiveForo] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await cursosGetMine({ limit: 50 });
      const lista = res.cursos ?? [];
      setCursos(lista);

      const map = {};
      await Promise.all(lista.map(async (c) => {
        const fr = await forosGetByCurso(c._id);
        map[c._id] = fr.foros ?? [];
      }));

      setForosByCurso(map);
      setLoading(false);
    })();
  }, []);

  if (activeForo) {
    return (
      <ForoDetalle
        foroId={activeForo}
        onBack={() => setActiveForo(null)}
      />
    );
  }

  return (
    <div>
      <h1>Foros</h1>

      {cursos.map(curso => (
        <div key={curso._id}>
          <h3>{curso.nombre}</h3>

          {(forosByCurso[curso._id] ?? []).map(f => (
            <ForoCard
              key={f._id}
              foro={f}
              onClick={() => setActiveForo(f._id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}