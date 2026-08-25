// src/features/familia/pages/FamiliaEntregaDetallePage.jsx
// ROL: Padre / Tutor — vista única de "hacer entrega" para UNA tarea puntual.
// URL propia (/familia/entregas/:tareaId) en vez de un modal con varios pasos
// internos: el padre llega directo al formulario de esa entrega, sin tener
// que abrir un curso, un modal, una lista y recién ahí encontrar el botón.
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileText, Send, Loader2, Paperclip, X,
  ExternalLink, Clock, BookOpen, AlertCircle, Link as LinkIcon, Lock,
  User, FolderOpen, Info,
} from "lucide-react";
import { tareasGetById } from "@/features/cursos/services/tareasService";
import {
  entregasGetMineByTarea, entregasCreate, entregasUpdate, entregasEnviar,
} from "@/features/entregas/services/entregasService";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { normalizeTarea, normalizeEntrega } from "@/lib/normalizers";
import { humanizeError } from "@/utils/humanizeError";
import { Toast, Badge, Button } from "@/components";
import { Sk, ESTADO_VARIANT, StarRating } from "../../cursos/components/shared/ui";

const ESTADO_LABEL = {
  borrador: "Borrador", enviada: "Enviada", tarde: "Entregada tarde", calificada: "Calificada",
};

// Texto legible por tipo de entrega — mismo mapeo que usa TareaDetalle.jsx
// (vista del docente), para que el padre vea el mismo dato con la misma
// etiqueta en vez de solo el valor crudo del backend ("archivo").
const TIPO_ENTREGA_LABELS = {
  archivo: "Archivo / Documento",
  texto: "Texto en línea",
  enlace: "Enlace (URL)",
  multimedia: "Multimedia",
  presencial: "Presencial",
  grupal: "Grupal",
};

// Mismos formatos/tamaño que valida uploadArchivoCloudinary en el backend
// (ver BACKEND EDUMON NUEVO/src/middlewares/cloudinaryMiddleware.js) — se
// muestran ANTES de intentar subir en vez de solo después de un error
// "Formato de archivo no permitido" sin ningún detalle de qué sí se acepta,
// y el <input type="file"> los usa como filtro nativo del selector.
const FORMATOS_PERMITIDOS_LABEL =
  "PDF, Word (.doc/.docx), Excel (.xls/.xlsx), imágenes (.jpg/.png) o video (.mp4/.mpeg/.webm) — máx. 10 MB por archivo";
const FORMATOS_PERMITIDOS_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4,.mpeg,.webm," +
  "application/pdf,application/msword," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.ms-excel," +
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "image/jpeg,image/png,video/mp4,video/mpeg,video/webm";

function formatFecha(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

export default function FamiliaEntregaDetallePage() {
  const { tareaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tarea, setTarea]     = useState(null);
  const [entrega, setEntrega] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [texto, setTexto]       = useState("");
  const [archivos, setArchivos] = useState([]);
  const [saving, setSaving]     = useState(null); // "borrador" | "enviar" | null
  const [toast, setToast]       = useState({ msg: "", type: "success" });
  const fileRef = useRef(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [tareaData, entregaData] = await Promise.all([
        tareasGetById(tareaId),
        entregasGetMineByTarea(tareaId).catch(() => null),
      ]);
      setTarea(normalizeTarea(tareaData.tarea ?? tareaData));
      const raw = entregaData?.entrega ?? entregaData?.entregas?.[0] ?? null;
      const e = normalizeEntrega(raw);
      setEntrega(e);
      if (e) setTexto(e.textoRespuesta ?? "");
    } catch (err) {
      setLoadError(humanizeError(err, "No se pudo cargar este reto"));
    } finally {
      setLoading(false);
    }
  }, [tareaId]);

  useEffect(() => { load(); }, [load]);

  // FIX: antes solo miraba entrega.estado, nunca tarea.estado — un padre
  // no se enteraba de que el reto estaba cerrado hasta que el envío le
  // fallaba con un toast de error. Ahora se muestra un aviso explícito
  // (más abajo) y el formulario se deshabilita antes de que intente nada.
  const tareaCerrada = tarea?.estado === "cerrada";
  const canEdit = !tareaCerrada && (!entrega || entrega.estado === "borrador");
  const canSend = !tareaCerrada && entrega?.estado === "borrador";

  const handleSaveDraft = async () => {
    setSaving("borrador");
    try {
      const esActualizacion = entrega && entrega.estado === "borrador";

      const fd = new FormData();
      // updateEntregaValidator.js rechaza la petición si tareaId/padreId
      // vienen en el body al actualizar un borrador ya existente — solo van
      // en la creación inicial.
      if (!esActualizacion) {
        fd.append("tareaId", tareaId);
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
      await load();
    } catch (err) {
      // El backend solo dice "Formato de archivo no permitido" sin listar
      // qué sí se acepta (humanizeError ya evita mostrar ese texto crudo,
      // pero acá se puede ser más útil y decir exactamente los formatos
      // válidos para una entrega, en vez del mensaje genérico).
      const rawMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "";
      const esErrorFormato = /formato.*(archivo|permitido)|tipo de archivo/i.test(rawMsg);
      notify(
        esErrorFormato
          ? `Ese archivo no tiene un formato permitido. Formatos aceptados: ${FORMATOS_PERMITIDOS_LABEL}.`
          : humanizeError(err, "Error al guardar el borrador"),
        "error"
      );
    } finally {
      setSaving(null);
    }
  };

  const handleSend = async () => {
    if (!entrega) {
      notify("Guarda un borrador antes de enviar", "error");
      return;
    }
    setSaving("enviar");
    try {
      await entregasEnviar(entrega._id);
      notify("Entrega enviada exitosamente");
      await load();
    } catch (err) {
      // Ej.: "La tarea está cerrada y no acepta entregas" — humanizeError
      // ahora sí muestra el motivo real del backend en vez de un genérico.
      notify(humanizeError(err, "Error al enviar la entrega"), "error");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Sk h={32} w="40%" />
        <div style={{ marginTop: 20 }}><Sk h={140} r={16} /></div>
        <div style={{ marginTop: 14 }}><Sk h={220} r={16} /></div>
      </div>
    );
  }

  if (loadError || !tarea) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/familia/tareas")} style={{ marginBottom: 16 }}>
          <ArrowLeft style={{ width: 15, height: 15 }} /> Volver a retos
        </Button>
        <div style={{
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 14, padding: "40px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        }}>
          <AlertCircle style={{ width: 32, height: 32, color: "var(--color-error-hover)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            {loadError ?? "No se pudo cargar este reto"}
          </p>
          <button onClick={load} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--color-primary)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const adjuntos = tarea.adjuntos ?? tarea.archivosAdjuntos ?? [];
  const materialArchivos = adjuntos.filter(a => a.tipo !== "enlace");
  const materialEnlaces  = adjuntos.filter(a => a.tipo === "enlace");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/familia/tareas")} style={{ marginBottom: 16 }}>
        <ArrowLeft style={{ width: 15, height: 15 }} /> Volver a retos
      </Button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: "rgba(99,102,241,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FileText style={{ width: 19, height: 19, color: "#6366F1" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
            {tarea.titulo}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
            {tarea.curso?.nombre && (
              <span style={{ fontSize: 12.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <BookOpen style={{ width: 12, height: 12 }} /> {tarea.curso.nombre}
              </span>
            )}
            {tarea.modulo?.titulo && (
              <span style={{ fontSize: 12.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <FolderOpen style={{ width: 12, height: 12 }} /> {tarea.modulo.titulo}
              </span>
            )}
            {(tarea.docente?.nombre || tarea.docente?.apellido) && (
              <span style={{ fontSize: 12.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <User style={{ width: 12, height: 12 }} /> {[tarea.docente.nombre, tarea.docente.apellido].filter(Boolean).join(" ")}
              </span>
            )}
            {tarea.fechaEntrega && (
              <span style={{ fontSize: 12.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock style={{ width: 12, height: 12 }} /> Entrega: {formatFecha(tarea.fechaEntrega)}
              </span>
            )}
          </div>
          {TIPO_ENTREGA_LABELS[tarea.tipoEntrega] && (
            <div style={{ marginTop: 8 }}>
              <Badge variant="neutral" size="sm">
                {TIPO_ENTREGA_LABELS[tarea.tipoEntrega]}
              </Badge>
            </div>
          )}
        </div>
        {entrega && (
          <Badge variant={ESTADO_VARIANT[entrega.estado] ?? "neutral"} size="sm" dot>
            {ESTADO_LABEL[entrega.estado] ?? entrega.estado}
          </Badge>
        )}
        {tareaCerrada && (
          <Badge variant="error" size="sm" dot>Reto cerrado</Badge>
        )}
      </div>

      {/* Aviso — visible ANTES de que el padre intente enviar, no solo como
          error después de un intento fallido. */}
      {tareaCerrada && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 16,
        }}>
          <Lock style={{ width: 17, height: 17, color: "var(--color-error-hover)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--color-error-hover)" }}>
              Este reto está cerrado
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              {entrega
                ? "Ya no puedes editar ni enviar cambios. Lo que se ve abajo es lo último que quedó guardado."
                : "El docente ya no acepta entregas para este reto."}
            </p>
          </div>
        </div>
      )}

      {/* Tarea: qué pide el docente */}
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: 14, padding: "16px 18px", marginBottom: 16,
      }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", marginBottom: 8 }}>
          Instrucciones del reto
        </p>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--color-text)", lineHeight: 1.7 }}>
          {tarea.descripcion || <span style={{ opacity: 0.6, fontStyle: "italic" }}>Sin descripción</span>}
        </p>
        {tarea.criterios && (
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--color-text)" }}>Criterios: </strong>{tarea.criterios}
          </p>
        )}
        {/* Antes este bloque no tenía ningún título — quedaba pegado debajo
            de los criterios sin ninguna señal de que era material aparte
            (archivos/enlaces que el docente adjuntó a la tarea), así que
            era fácil no darse cuenta de que estaba ahí. */}
        {(materialArchivos.length > 0 || materialEnlaces.length > 0) && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
            Material de apoyo
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {materialArchivos.map((a, i) => (
              <a key={`f${i}`} href={a.url} target="_blank" rel="noreferrer" style={{
                display: "flex", alignItems: "center", gap: 5, fontSize: 12,
                padding: "5px 10px", borderRadius: 6, textDecoration: "none",
                background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)",
              }}>
                <Paperclip style={{ width: 11, height: 11 }} /> {a.nombre || "Archivo"}
              </a>
            ))}
            {materialEnlaces.map((e, i) => (
              <a key={`l${i}`} href={e.url} target="_blank" rel="noreferrer" style={{
                display: "flex", alignItems: "center", gap: 5, fontSize: 12,
                padding: "5px 10px", borderRadius: 6, textDecoration: "none",
                background: "rgba(12,106,196,0.08)", border: "1px solid rgba(12,106,196,0.2)", color: "var(--color-primary)",
              }}>
                <LinkIcon style={{ width: 11, height: 11 }} /> {e.nombre || "Enlace"}
              </a>
            ))}
          </div>
          </div>
        )}
      </div>

      {/* Calificación (si ya la calificaron) */}
      {entrega?.estado === "calificada" && (() => {
        const val = entrega.calificacion?.valoracion;
        const valida = Number.isInteger(val) && val >= 1 && val <= 5;
        return (
          <div style={{
            background: valida ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.06)",
            border: `1px solid ${valida ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
            borderRadius: 14, padding: "16px 18px", marginBottom: 16,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: valida ? "var(--edu-green-600)" : "var(--color-error-hover)", margin: "0 0 8px" }}>
              Calificación del docente
            </p>
            {valida ? <StarRating value={val} size={20} showLabel /> : (
              <span style={{ fontSize: 13, color: "var(--color-error-hover)" }}>Nota inválida</span>
            )}
            {valida && entrega.calificacion?.comentario && (
              <p style={{ fontSize: 13.5, color: "var(--color-text-muted)", margin: "10px 0 0", lineHeight: 1.6 }}>
                {entrega.calificacion.comentario}
              </p>
            )}
          </div>
        );
      })()}

      {/* Formulario de respuesta — si el reto está cerrado y nunca hubo
          entrega, no hay nada que mostrar aquí: el aviso de arriba ya lo
          explica, mostrar una caja vacía "Sin respuesta escrita" solo suma
          confusión. */}
      {(entrega || !tareaCerrada) && (
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: 14, padding: "18px 20px",
      }}>
        <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: "var(--color-text)" }}>
          {canEdit ? "Tu respuesta" : "Tu entrega"}
        </p>

        {canEdit ? (
          <>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Escribe tu respuesta aquí…"
              rows={7}
              style={{
                width: "100%", padding: "12px 14px", fontSize: 14,
                borderRadius: 10, border: "1.5px solid var(--color-border)",
                background: "var(--color-bg)", color: "var(--color-text)",
                outline: "none", resize: "vertical", fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--color-primary)")}
              onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
            />

            <input
              ref={fileRef} type="file" multiple style={{ display: "none" }}
              accept={FORMATOS_PERMITIDOS_ACCEPT}
              onChange={e => setArchivos(prev => [...prev, ...Array.from(e.target.files)])}
            />
            <button
              type="button" onClick={() => fileRef.current?.click()}
              style={{
                marginTop: 12, display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "1.5px dashed var(--color-border)",
                borderRadius: 8, padding: "9px 16px", cursor: "pointer",
                fontSize: 13, color: "var(--color-text-muted)", transition: "all 150ms",
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
              <Paperclip style={{ width: 14, height: 14 }} />
              Adjuntar archivos {archivos.length > 0 && `(${archivos.length})`}
            </button>
            {/* Formatos aceptados a la vista ANTES de intentar subir — antes
                el único aviso era el error genérico del backend después de
                un intento fallido. */}
            <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--color-text-muted)", display: "flex", alignItems: "flex-start", gap: 5, lineHeight: 1.5 }}>
              <Info style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} />
              Formatos aceptados: {FORMATOS_PERMITIDOS_LABEL}.
            </p>

            {archivos.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {archivos.map((f, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "var(--color-bg)", border: "1px solid var(--color-border)",
                    borderRadius: 6, padding: "5px 10px", fontSize: 12.5,
                  }}>
                    <Paperclip style={{ width: 11, height: 11, color: "#6366F1" }} />
                    <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </span>
                    <button
                      onClick={() => setArchivos(a => a.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      <X style={{ width: 12, height: 12, color: "var(--color-error-hover)" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 14, color: "var(--color-text)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {entrega?.textoRespuesta || <span style={{ opacity: 0.6, fontStyle: "italic" }}>Sin respuesta escrita</span>}
          </p>
        )}

        {entrega?.archivos?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Archivos adjuntos
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {entrega.archivos.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(12,106,196,0.08)", border: "1px solid rgba(12,106,196,0.2)",
                  borderRadius: 8, padding: "6px 12px", fontSize: 12.5, color: "var(--color-primary)",
                  textDecoration: "none",
                }}>
                  <ExternalLink style={{ width: 12, height: 12 }} />
                  {a.nombre ?? a.url?.split("/").pop() ?? "Archivo"}
                </a>
              ))}
            </div>
          </div>
        )}

        {canEdit && (
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={handleSaveDraft} disabled={saving !== null}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--color-bg)", border: "1.5px solid var(--color-border)",
                borderRadius: 9, padding: "10px 18px", fontSize: 13.5, fontWeight: 600,
                cursor: saving !== null ? "not-allowed" : "pointer", color: "var(--color-text)",
              }}
            >
              {saving === "borrador"
                ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                : <FileText style={{ width: 14, height: 14 }} />}
              Guardar borrador
            </button>
            {canSend && (
              <button
                onClick={handleSend} disabled={saving !== null}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: saving !== null ? "var(--color-border)" : "var(--edu-green-600)",
                  border: "none", borderRadius: 9, padding: "10px 18px",
                  fontSize: 13.5, fontWeight: 700, color: "white",
                  cursor: saving !== null ? "not-allowed" : "pointer",
                }}
              >
                {saving === "enviar"
                  ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                  : <Send style={{ width: 14, height: 14 }} />}
                Enviar entrega
              </button>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
