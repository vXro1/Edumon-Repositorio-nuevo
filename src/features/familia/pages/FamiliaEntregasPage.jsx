// src/features/familia/pages/FamiliaEntregasPage.jsx
// ROL: Padre / Tutor — Mis entregas: crear borrador, adjuntar, enviar
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FileText, Plus, Send, Loader2, AlertCircle, CheckCircle2,
  Upload, X, ExternalLink, ChevronDown, ChevronUp,
  Paperclip, Clock, BookOpen, Star,
} from "lucide-react";
import { tareasGetAll, tareasGetById } from "@/features/cursos/services/tareasService";
import { entregasGetMineByTarea, entregasCreate, entregasUpdate, entregasEnviar } from "@/features/entregas/services/entregasService";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { normalizeTarea, normalizeEntrega }from "@/lib/normalizers";
import { humanizeError } from "@/utils/humanizeError";
import { Toast, Badge } from "@/components";

const ESTADO_ENTREGA = {
  borrador:   { label: "Borrador",   variant: "neutral" },
  enviada:    { label: "Enviada",    variant: "purple" },
  tarde:      { label: "Tarde",      variant: "warning" },
  calificada: { label: "Calificada", variant: "success" },
};

function Sk({ h = 14, w = "100%", r = 6 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function EstadoBadge({ estado }) {
  const m = ESTADO_ENTREGA[estado] ?? { label: estado, variant: "neutral" };
  return (
    <Badge variant={m.variant} size="sm" dot>
      {m.label}
    </Badge>
  );
}

function formatFecha(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

// ── Tarea card expandible ─────────────────────────────────────
function TareaCard({ tarea, user }) {
  const [open,      setOpen]      = useState(false);
  const [entrega,   setEntrega]   = useState(null);
  const [loadingE,  setLoadingE]  = useState(false);
  const [texto,     setTexto]     = useState("");
  const [archivos,  setArchivos]  = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState({ msg: "", type: "success" });
  const fileRef = useRef(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const loadEntrega = useCallback(async () => {
    setLoadingE(true);
    try {
      const res = await entregasGetMineByTarea(tarea._id);
      const raw = res.entrega ?? res.entregas?.[0] ?? null;
      const e = normalizeEntrega(raw);
      setEntrega(e);
      if (e) setTexto(e.textoRespuesta ?? "");
    } catch { /* puede no existir */ }
    finally { setLoadingE(false); }
  }, [tarea._id]);

  useEffect(() => {
    if (open) loadEntrega();
  }, [open, loadEntrega]);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const esActualizacion = entrega && entrega.estado === "borrador";

      const fd = new FormData();
      // updateEntregaValidator.js RECHAZA la petición si tareaId o padreId
      // vienen en el body ("No puedes cambiar el padre/tarea de una
      // entrega") — solo van en el create inicial, nunca al actualizar un
      // borrador ya existente.
      if (!esActualizacion) {
        fd.append("tareaId", tarea._id);
        fd.append("padreId", user._id ?? user.id);
      }
      fd.append("textoRespuesta", texto);
      fd.append("estado", "borrador");
      archivos.forEach(f => fd.append("archivos", f));

      if (esActualizacion) {
        await entregasUpdate(entrega._id, fd);
        notify("Borrador guardado");
      } else {
        await entregasCreate(fd);
        notify("Borrador creado");
      }
      setArchivos([]);
      loadEntrega();
    } catch (err) {
      notify(humanizeError(err, "Error al guardar"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!entrega) { notify("Guarda un borrador primero", "error"); return; }
    setSaving(true);
    try {
      await entregasEnviar(entrega._id);
      notify("Entrega enviada exitosamente");
      loadEntrega();
    } catch (err) {
      notify(humanizeError(err, "Error al enviar entrega"), "error");
    } finally {
      setSaving(false);
    }
  };

  const canEdit = !entrega || entrega.estado === "borrador";
  const canSend = entrega?.estado === "borrador";

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 14, overflow: "hidden",
      marginBottom: 12,
      boxShadow: "var(--clay-card)",
    }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Fila de encabezado */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px", cursor: "pointer",
          borderBottom: open ? "1px solid var(--color-border)" : "none",
          transition: "background 150ms",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: "rgba(99,102,241,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FileText style={{ width: 15, height: 15, color: "#6366F1" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            {tarea.titulo}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
            {tarea.curso && (
              <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <BookOpen style={{ width: 10, height: 10 }} />
                {tarea.curso.nombre}
              </span>
            )}
            {tarea.fechaEntrega && (
              <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <Clock style={{ width: 10, height: 10 }} />
                {formatFecha(tarea.fechaEntrega)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {entrega && <EstadoBadge estado={entrega.estado} />}
          {open
            ? <ChevronUp style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
            : <ChevronDown style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
          }
        </div>
      </div>

      {/* Panel expandido */}
      {open && (
        <div style={{ padding: "18px 20px" }}>
          {loadingE ? (
            <div>
              <Sk h={14} w="60%" />
              <div style={{ marginTop: 8 }}><Sk h={80} /></div>
            </div>
          ) : (
            <>
              {/* Descripción de la tarea */}
              {tarea.descripcion && (
                <div style={{
                  background: "var(--color-bg)", borderRadius: 10,
                  padding: "12px 14px", marginBottom: 16,
                  fontSize: 13, color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                    Descripción
                  </p>
                  {tarea.descripcion}
                </div>
              )}

              {/* Calificación */}
              {entrega?.estado === "calificada" && (() => {
                const val = entrega.calificacion?.valoracion;
                const valida = Number.isInteger(val) && val >= 1 && val <= 5;
                return (
                  <div style={{
                    background: valida ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.06)",
                    border: `1px solid ${valida ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
                    borderRadius: 12, padding: "14px 16px", marginBottom: 16,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: valida ? "var(--edu-green-600)" : "var(--color-error-hover)", margin: 0 }}>
                        Calificación:
                      </p>
                      {valida ? (
                        <>
                          <div style={{ display: "inline-flex", gap: 3 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} style={{
                                width: 18, height: 18,
                                fill: n <= val ? "#F59E0B" : "none",
                                color: n <= val ? "#F59E0B" : "#D1D5DB",
                              }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 13, color: "var(--edu-green-600)", fontWeight: 700 }}>{val}/5</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 13, color: "var(--color-error-hover)" }}>Nota inválida</span>
                      )}
                    </div>
                    {valida && entrega.calificacion?.comentario && (
                      <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "8px 0 0" }}>
                        {entrega.calificacion.comentario}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Respuesta */}
              {canEdit && (
                <>
                  <label style={{
                    display: "block", fontSize: 11.5, fontWeight: 700,
                    color: "var(--color-text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.05em", marginBottom: 6,
                  }}>
                    Tu respuesta
                  </label>
                  <textarea
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    placeholder="Escribe tu respuesta aquí…"
                    rows={5}
                    style={{
                      width: "100%", padding: "10px 12px", fontSize: 13.5,
                      borderRadius: 10, border: "1.5px solid var(--color-border)",
                      background: "var(--color-bg)", color: "var(--color-text)",
                      outline: "none", resize: "vertical", fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                    onFocus={e => (e.target.style.borderColor = "var(--color-primary)")}
                    onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
                  />

                  {/* Selector de archivos */}
                  <input
                    ref={fileRef} type="file" multiple style={{ display: "none" }}
                    onChange={e => setArchivos(prev => [...prev, ...Array.from(e.target.files)])}
                  />
                  <button
                    type="button" onClick={() => fileRef.current?.click()}
                    style={{
                      marginTop: 10, display: "flex", alignItems: "center", gap: 6,
                      background: "none", border: "1.5px dashed var(--color-border)",
                      borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                      fontSize: 12.5, color: "var(--color-text-muted)", transition: "all 150ms",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "var(--color-primary)";
                      e.currentTarget.style.color = "var(--color-primary)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.color = "var(--color-text-muted)";
                    }}
                  >
                    <Paperclip style={{ width: 13, height: 13 }} />
                    Adjuntar archivos {archivos.length > 0 && `(${archivos.length})`}
                  </button>

                  {/* Lista de archivos */}
                  {archivos.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {archivos.map((f, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 5,
                          background: "var(--color-bg)", border: "1px solid var(--color-border)",
                          borderRadius: 6, padding: "4px 8px", fontSize: 12,
                        }}>
                          <Paperclip style={{ width: 11, height: 11, color: "#6366F1" }} />
                          <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.name}
                          </span>
                          <button
                            onClick={() => setArchivos(a => a.filter((_, j) => j !== i))}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                          >
                            <X style={{ width: 11, height: 11, color: "var(--color-error-hover)" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Archivos existentes */}
              {entrega?.archivos?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    Archivos adjuntos
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {entrega.archivos.map((a, i) => (
                      <a
                        key={i} href={a.url} target="_blank" rel="noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          background: "rgba(12,106,196,0.08)", border: "1px solid rgba(12,106,196,0.2)",
                          borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "var(--color-primary)",
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink style={{ width: 11, height: 11 }} />
                        {a.nombre ?? a.url?.split("/").pop() ?? "Archivo"}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Texto de entrega (si ya fue enviada) */}
              {!canEdit && entrega?.textoRespuesta && (
                <div style={{
                  background: "var(--color-bg)", borderRadius: 10,
                  padding: "12px 14px", marginTop: 12,
                  fontSize: 13, color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                }}>
                  {entrega.textoRespuesta}
                </div>
              )}

              {/* Acciones */}
              {canEdit && (
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button
                    onClick={handleSaveDraft} disabled={saving}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "var(--color-bg)", border: "1.5px solid var(--color-border)",
                      borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600,
                      cursor: saving ? "not-allowed" : "pointer", color: "var(--color-text)",
                    }}
                  >
                    {saving ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <FileText style={{ width: 13, height: 13 }} />}
                    Guardar borrador
                  </button>
                  {canSend && (
                    <button
                      onClick={handleSend} disabled={saving}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: saving ? "var(--color-border)" : "var(--edu-green-600)",
                        border: "none", borderRadius: 8, padding: "9px 16px",
                        fontSize: 13, fontWeight: 700, color: "white",
                        cursor: saving ? "not-allowed" : "pointer",
                      }}
                    >
                      {saving ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 13, height: 13 }} />}
                      Enviar entrega
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function FamiliaEntregasPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tareas,   setTareas]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search,   setSearch]   = useState("");

  const tareaIdParam = searchParams.get("tareaId");

  const loadTareas = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await tareasGetAll({ limit: 100 });
      let lista = (res?.tareas ?? res?.data ?? []).map(normalizeTarea);
      if (tareaIdParam) {
        lista = [
          ...lista.filter(t => t._id === tareaIdParam),
          ...lista.filter(t => t._id !== tareaIdParam),
        ];
      }
      setTareas(lista);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTareas(); }, [tareaIdParam]);

  const filtered = search
    ? tareas.filter(t =>
        t.titulo?.toLowerCase().includes(search.toLowerCase()) ||
        t.curso?.nombre?.toLowerCase().includes(search.toLowerCase())
      )
    : tareas;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: "rgba(99,102,241,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FileText style={{ width: 18, height: 18, color: "#6366F1" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Mis entregas</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
            Gestiona las entregas de tus retos
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
        background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
        borderRadius: 10, padding: "8px 12px", maxWidth: 320,
      }}>
        <FileText style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar reto…"
          style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: "var(--color-text)", flex: 1 }}
        />
      </div>

      {/* Estado de error */}
      {apiError && (
        <div style={{
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 14, padding: "40px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        }}>
          <AlertCircle style={{ width: 32, height: 32, color: "var(--color-error-hover)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>No se pudieron cargar las tareas</p>
          <button onClick={loadTareas} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--color-primary)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>Reintentar</button>
        </div>
      )}

      {/* Lista de tareas */}
      {!apiError && (loading ? (
        [0,1,2,3].map(i => (
          <div key={i} style={{
            background: "var(--color-surface)", borderRadius: 14,
            border: "1px solid var(--color-border)", padding: "14px 18px",
            marginBottom: 12, display: "flex", gap: 14,
          }}>
            <Sk h={36} w={36} r={9} />
            <div style={{ flex: 1 }}>
              <Sk h={14} w="55%" />
              <div style={{ marginTop: 8 }}><Sk h={11} w="35%" /></div>
            </div>
          </div>
        ))
      ) : filtered.length === 0 ? (
        <div style={{
          background: "var(--color-surface)", borderRadius: 16,
          border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)",
          padding: "60px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <AlertCircle style={{ width: 36, height: 36, color: "var(--color-text-muted)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>
            No hay retos disponibles
          </p>
        </div>
      ) : (
        filtered.map(t => (
          <TareaCard key={t._id} tarea={t} user={user} />
        ))
      ))}
    </div>
  );
}