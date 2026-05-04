// src/features/cursos/components/foros/ForosTab.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Send, Lock } from "lucide-react";
import {
  forosGetByCurso, forosCreate,
  mensajesForoGetByForo, mensajesForoCreate,
  mensajesForoToggleLike, mensajesForoDelete,
} from "@/lib/apiClient";
import { Button, Input, Modal, FileUpload, Toast } from "@/components";
import { Sk, SectionHeader, Field, StTextarea } from "../shared/ui";
import { makeNotify, fmtHour, getAutor, getNombre, getAvatar, isMine } from "../shared/helpers";
import { ArchivoRecibido } from "../shared/ArchivoComponents";
// ─────────────────────────────────────────────────────────────────────────────
export default function ForosTab({ cursoId, canCreate = false, isDocente = false, userId }) {
  const [foros, setForos]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showCrear, setShowCrear] = useState(false);
  const [toast, setToast]         = useState({ msg: "", type: "success" });
  const notify = makeNotify(setToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forosGetByCurso(cursoId);
      setForos(res.foros ?? []);
    } catch { setForos([]); }
    finally { setLoading(false); }
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  const handleCrearForo = async ({ titulo, descripcion, archivos }) => {
    const fd = new FormData();
    fd.append("titulo", titulo);
    fd.append("descripcion", descripcion);
    fd.append("cursoId", cursoId);
    fd.append("publico", "false");
    archivos.forEach((f) => fd.append("archivos", f));
    await forosCreate(fd);
    setShowCrear(false);
    notify("Foro creado");
    load();
  };

  return (
    <div>
      <Toast {...toast} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <SectionHeader title="Foros" />
        {canCreate && (
          <Button size="sm" onClick={() => setShowCrear(true)}>+ Nuevo foro</Button>
        )}
      </div>

      {/* Modal: crear foro */}
      <Modal isOpen={showCrear} onClose={() => setShowCrear(false)} title="Crear nuevo foro" size="md">
        <ForoCrearForm onSubmit={handleCrearForo} onCancel={() => setShowCrear(false)} />
      </Modal>

      {/* Lista de foros */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0, 1].map((i) => <Sk key={i} h={72} r={12} />)}
        </div>
      ) : foros.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", textAlign: "center", marginTop: 32, fontSize: 13 }}>
          No hay foros disponibles en este curso.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {foros.map((f) => (
            <div key={f._id} style={{
              padding: "14px 16px", borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", transition: "border-color 0.15s",
            }}
              onClick={() => setSelected(f)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: f.estado === "cerrado" ? "var(--color-border)" : "rgba(12,106,196,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {f.estado === "cerrado"
                  ? <Lock style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
                  : <MessageSquare style={{ width: 16, height: 16, color: "var(--color-primary)" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontWeight: 700, margin: 0, fontSize: 14, color: "var(--color-text)" }}>
                    {f.titulo}
                  </p>
                  {f.estado === "cerrado" && (
                    <span style={{ fontSize: 10, background: "#fee2e2", color: "#dc2626",
                      padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>
                      Cerrado
                    </span>
                  )}
                </div>
                {f.descripcion && (
                  <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: "3px 0 0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.descripcion}
                  </p>
                )}
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "3px 0 0" }}>
                  {f.totalMensajes ?? 0} mensajes
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(f); }}>
                Ver foro →
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: ver foro (sin padding interno — el detalle gestiona su propio layout) */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} size="lg"
        title={selected?.titulo} description={selected?.descripcion}>
        {selected && (
          <ForoDetalle foro={selected} userId={userId} isDocente={isDocente}
            onForoUpdated={load} />
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ForoCrearForm
// ─────────────────────────────────────────────────────────────────────────────
function ForoCrearForm({ onSubmit, onCancel }) {
  const [titulo, setTitulo]           = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const handleSubmit = async () => {
    setError("");
    if (titulo.trim().length < 5) { setError("El título debe tener al menos 5 caracteres."); return; }
    if (descripcion.trim().length < 10) { setError("La descripción debe tener al menos 10 caracteres."); return; }
    setLoading(true);
    try {
      await onSubmit({ titulo: titulo.trim(), descripcion: descripcion.trim(), archivos });
    } catch (err) {
      setError(err?.message ?? "Error al crear el foro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <div style={{ background: "#fee2e2", color: "#dc2626",
          padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
          {error}
        </div>
      )}

      <Field label="Título *">
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)}
          placeholder="Mínimo 5 caracteres" />
        <span style={{ fontSize: 11, color: titulo.length < 5 ? "#dc2626" : "var(--color-text-muted)" }}>
          {titulo.length} / 200
        </span>
      </Field>

      <Field label="Descripción *">
        <StTextarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe de qué trata el foro (mínimo 10 caracteres)" rows={4} />
        <span style={{ fontSize: 11, color: descripcion.length < 10 ? "#dc2626" : "var(--color-text-muted)" }}>
          {descripcion.length} / 2000
        </span>
      </Field>

      <Field label="Archivos adjuntos (opcional)">
        <FileUpload
          files={archivos}
          onChange={setArchivos}
          accept="image/*,video/mp4,.pdf"
          maxFiles={5}
          label="Arrastra o haz clic para adjuntar imágenes, video o PDF"
        />
      </Field>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end",
        paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit}
          disabled={loading || titulo.trim().length < 5 || descripcion.trim().length < 10}>
          {loading ? "Creando..." : "Crear foro"}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ForoDetalle — chat-style view inside the modal
// ─────────────────────────────────────────────────────────────────────────────
function ForoDetalle({ foro, userId, isDocente, onForoUpdated }) {
  const [mensajes, setMensajes]   = useState([]);
  const [texto, setTexto]         = useState("");
  const [replyTo, setReplyTo]     = useState(null);
  const [likes, setLikes]         = useState({});
  const [archivos, setArchivos]   = useState([]);
  const [sending, setSending]     = useState(false);
  const [foroEstado]              = useState(foro.estado ?? "abierto");
  const bottomRef                 = useRef(null);
  const cerrado                   = foroEstado === "cerrado";

  const load = useCallback(async () => {
    try {
      const res  = await mensajesForoGetByForo(foro._id);
      const msgs = res.mensajes ?? [];
      setMensajes(msgs);
      const init = {};
      const proc = (m) => {
        const arr = Array.isArray(m.likes) ? m.likes : [];
        init[m._id] = arr.some((id) => String(id) === String(userId));
      };
      msgs.forEach((m) => { proc(m); (m.respuestas ?? []).forEach(proc); });
      setLikes(init);
    } catch { setMensajes([]); }
  }, [foro._id, userId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

  const canSend = (!cerrado && !sending) && (texto.trim().length > 0 || archivos.length > 0);

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("foroId", String(foro._id));
      // contenido es requerido por el backend; si solo hay archivos, usar placeholder
      fd.append("contenido", texto.trim() || "(Archivo adjunto)");
      if (replyTo?._id) fd.append("respuestaA", String(replyTo._id));
      archivos.forEach((f) => fd.append("archivos", f));
      await mensajesForoCreate(fd);
      setTexto(""); setReplyTo(null); setArchivos([]);
      load();
    } catch (err) {
      alert("No se pudo enviar: " + (err?.message ?? "error desconocido"));
    } finally {
      setSending(false);
    }
  };

  const handleLike = async (msgId) => {
    try {
      const res = await mensajesForoToggleLike(msgId);
      setLikes((p) => ({ ...p, [msgId]: res.yaLeDioLike ?? !p[msgId] }));
      setMensajes((prev) => prev.map((m) => {
        if (m._id === msgId) return { ...m, likes: res.likes ?? m.likes };
        const respuestas = (m.respuestas ?? []).map((r) =>
          r._id === msgId ? { ...r, likes: res.likes ?? r.likes } : r
        );
        return { ...m, respuestas };
      }));
    } catch { /* silencioso */ }
  };

  const handleDelete = async (msgId) => {
    if (!confirm("¿Eliminar este mensaje?")) return;
    try {
      await mensajesForoDelete(msgId);
      load();
    } catch { /* silencioso */ }
  };

  const todosLosMensajes = mensajes.flatMap((m) => [
    { ...m, esRespuesta: false },
    ...(m.respuestas ?? []).map((r) => ({
      ...r, esRespuesta: true,
      padreContenido: m.contenido, padreAutor: getAutor(m),
    })),
  ]);

  return (
    /* Negative margin escapes the modal body padding to fill width completely */
    <div style={{
      margin: "-20px -24px -24px",
      display: "flex", flexDirection: "column",
      height: "clamp(380px, 60dvh, 580px)",
    }}>
      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", minHeight: 0 }}>
        {todosLosMensajes.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <MessageSquare style={{ width: 32, height: 32, color: "var(--color-border)", margin: "0 auto 10px" }} />
            <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
              Sé el primero en escribir en este foro.
            </p>
          </div>
        )}
        {todosLosMensajes.map((m) => (
          <MensajeBurbuja key={m._id} mensaje={m}
            autor={getAutor(m)} mine={isMine(m, userId)}
            liked={!!likes[m._id]}
            likesCount={Array.isArray(m.likes) ? m.likes.length : (typeof m.likes === "number" ? m.likes : 0)}
            puedeBorrar={isMine(m, userId) || isDocente}
            esRespuesta={m.esRespuesta}
            padreContenido={m.padreContenido}
            padreAutor={m.padreAutor}
            onLike={() => handleLike(m._id)}
            onReply={cerrado ? undefined : () => setReplyTo(m)}
            onDelete={() => handleDelete(m._id)} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        flexShrink: 0, borderTop: "1px solid var(--color-border)",
        background: "var(--color-surface)", padding: "10px 16px 14px",
      }}>
        {cerrado && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
            color: "#dc2626", fontSize: 13, marginBottom: 8 }}>
            <Lock style={{ width: 13, height: 13 }} /> Este foro está cerrado.
          </div>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div style={{
            fontSize: 12, marginBottom: 8, padding: "5px 10px",
            background: "var(--color-bg)", borderRadius: 6,
            borderLeft: "3px solid var(--color-primary)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>
              ↩ <strong>{getNombre(getAutor(replyTo))}</strong>
              <span style={{ color: "var(--color-text-muted)", marginLeft: 4 }}>
                {replyTo.contenido?.slice(0, 60)}{replyTo.contenido?.length > 60 ? "…" : ""}
              </span>
            </span>
            <button onClick={() => setReplyTo(null)}
              style={{ background: "none", border: "none", cursor: "pointer",
                fontSize: 14, color: "var(--color-text-muted)", padding: "0 4px" }}>✕</button>
          </div>
        )}

        {/* File previews */}
        {archivos.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <FileUpload compact files={archivos} onChange={setArchivos}
              accept="image/*,video/mp4,.pdf" maxFiles={5} />
          </div>
        )}

        {/* Message row */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          {/* Attach button (compact, no thumbs shown here — shown above) */}
          {!cerrado && (
            <FileUpload compact files={archivos} onChange={setArchivos}
              accept="image/*,video/mp4,.pdf" maxFiles={5} />
          )}

          <Input value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={cerrado ? "Foro cerrado" : "Escribe un mensaje… (Enter para enviar)"}
            disabled={cerrado || sending}
            style={{ flex: 1 }} />

          <Button onClick={send} disabled={!canSend}
            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
            {sending ? "⏳" : <Send style={{ width: 15, height: 15 }} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MensajeBurbuja
// ─────────────────────────────────────────────────────────────────────────────
function MensajeBurbuja({ mensaje: m, autor, mine, liked, likesCount, puedeBorrar,
  esRespuesta, padreContenido, padreAutor, onLike, onReply, onDelete }) {
  const nombre    = getNombre(autor);
  const avatarUrl = getAvatar(autor);
  const isPlaceholder = m.contenido === "(Archivo adjunto)" && Array.isArray(m.archivos) && m.archivos.length > 0;

  return (
    <div style={{
      display: "flex",
      flexDirection: mine ? "row-reverse" : "row",
      gap: 8, marginBottom: 14,
      marginLeft: esRespuesta ? 44 : 0,
      alignItems: "flex-start",
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: avatarUrl ? "transparent" : "var(--color-border)",
        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)",
        border: "2px solid var(--color-border)",
      }}>
        {avatarUrl
          ? <img src={avatarUrl} alt={nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : (nombre[0] ?? "U").toUpperCase()}
      </div>

      <div style={{ maxWidth: "75%", minWidth: 0 }}>
        {/* Nombre + rol */}
        <p style={{
          margin: "0 0 3px", fontSize: 11, color: "var(--color-text-muted)",
          textAlign: mine ? "right" : "left",
          display: "flex", alignItems: "center", gap: 4,
          flexDirection: mine ? "row-reverse" : "row",
        }}>
          <span>{nombre}</span>
          {autor?.rol === "docente" && (
            <span style={{
              background: "#dbeafe", color: "#1d4ed8",
              padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
            }}>DOCENTE</span>
          )}
        </p>

        {/* Cita padre */}
        {esRespuesta && padreContenido && (
          <div style={{
            fontSize: 11, padding: "4px 10px", marginBottom: 2,
            borderRadius: "6px 6px 0 0",
            background: mine ? "#1e3a8a" : "var(--color-bg)",
            color: mine ? "#93c5fd" : "var(--color-text-muted)",
            borderLeft: `3px solid ${mine ? "#60a5fa" : "var(--color-border)"}`,
          }}>
            ↳ <strong>{getNombre(padreAutor)}</strong>:{" "}
            {padreContenido?.slice(0, 70)}{padreContenido?.length > 70 ? "…" : ""}
          </div>
        )}

        {/* Burbuja */}
        <div style={{
          background: mine ? "var(--color-primary)" : "var(--color-surface)",
          color: mine ? "white" : "var(--color-text)",
          padding: "9px 13px",
          borderRadius: mine ? "14px 3px 14px 14px" : "3px 14px 14px 14px",
          border: mine ? "none" : "1px solid var(--color-border)",
          wordBreak: "break-word",
        }}>
          {/* Texto — ocultar el placeholder si hay archivos */}
          {!isPlaceholder && m.contenido && (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {m.contenido}
            </p>
          )}

          {/* Archivos adjuntos */}
          {Array.isArray(m.archivos) && m.archivos.length > 0 && (
            <div style={{ marginTop: isPlaceholder ? 0 : 8 }}>
              {m.archivos.map((a, i) => (
                <ArchivoRecibido key={a._id ?? i} a={a} mine={mine} />
              ))}
            </div>
          )}

          {/* Acciones */}
          <div style={{
            display: "flex", gap: 10, marginTop: 8, fontSize: 11, alignItems: "center",
            borderTop: `1px solid ${mine ? "rgba(255,255,255,0.15)" : "var(--color-border)"}`,
            paddingTop: 6,
          }}>
            <button onClick={onLike} style={{
              background: "none", border: "none", cursor: "pointer", fontSize: 12,
              color: mine ? "white" : "inherit", padding: 0,
              display: "flex", alignItems: "center", gap: 3,
            }}>
              {liked ? "❤️" : "🤍"} <span>{likesCount}</span>
            </button>

            {onReply && (
              <button onClick={onReply} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: mine ? "rgba(255,255,255,0.8)" : "var(--color-text-muted)", padding: 0,
              }}>↩ Responder</button>
            )}

            {puedeBorrar && (
              <button onClick={onDelete} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: mine ? "#fca5a5" : "#dc2626",
                padding: 0, marginLeft: "auto",
              }}>🗑 Eliminar</button>
            )}

            <span style={{
              marginLeft: puedeBorrar ? 0 : "auto",
              color: mine ? "rgba(255,255,255,0.5)" : "var(--color-text-muted)",
              fontSize: 10,
            }}>
              {fmtHour(m.createdAt ?? m.fechaCreacion ?? m.fecha)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
