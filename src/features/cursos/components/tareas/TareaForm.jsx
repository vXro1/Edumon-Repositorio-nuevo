// src/features/cursos/components/tareas/TareaForm.jsx
import { useRef, useEffect, useState } from "react";
import { FileText, Upload, X, Globe, Users, Link2, Calendar, Clock, Eye, ZoomIn, ZoomOut, RotateCcw, ExternalLink, Check } from "lucide-react";
import { Input, Textarea, Select, Checkbox } from "@/components";
import { Field, Sk } from "../shared/ui";

const TIPO_ENTREGA_OPTS = [
  { value: "archivo",    label: "Archivo / Documento" },
  { value: "texto",      label: "Texto en línea" },
  { value: "enlace",     label: "Enlace (URL)" },
  { value: "multimedia", label: "Multimedia" },
  { value: "presencial", label: "Presencial" },
  { value: "grupal",     label: "Grupal" },
];

/* ── Texto de error inline (no depende de que Input soporte prop error) ── */
function FieldError({ message }) {
  if (!message) return null;
  return (
    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-error)", fontWeight: 600 }}>
      {message}
    </p>
  );
}

/* ── Helpers de formato ───────────────────────────────────────────── */
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
function isImageName(name = "") {
  const ext = name.split(".").pop()?.toLowerCase();
  return IMAGE_EXTS.includes(ext);
}

function isPdfName(name = "") {
  return (name.split(".").pop() || "").toLowerCase() === "pdf";
}

// Insignia de color por tipo de archivo — más confiable visualmente que
// adivinar un ícono específico por extensión, y no depende de qué íconos
// tenga disponibles la librería.
const FILE_BADGES = {
  pdf:  { label: "PDF",  bg: "#FEE2E2", fg: "var(--color-error-hover)" },
  doc:  { label: "DOC",  bg: "#DBEAFE", fg: "#2563EB" },
  docx: { label: "DOCX", bg: "#DBEAFE", fg: "#2563EB" },
  xls:  { label: "XLS",  bg: "#DCFCE7", fg: "var(--edu-green-600)" },
  xlsx: { label: "XLSX", bg: "#DCFCE7", fg: "var(--edu-green-600)" },
  csv:  { label: "CSV",  bg: "#DCFCE7", fg: "var(--edu-green-600)" },
  ppt:  { label: "PPT",  bg: "#FFEDD5", fg: "#EA580C" },
  pptx: { label: "PPTX", bg: "#FFEDD5", fg: "#EA580C" },
  zip:  { label: "ZIP",  bg: "#F3E8FF", fg: "#9333EA" },
  rar:  { label: "RAR",  bg: "#F3E8FF", fg: "#9333EA" },
  txt:  { label: "TXT",  bg: "#F1F5F9", fg: "#475569" },
};
function getFileBadge(name = "") {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return FILE_BADGES[ext] || { label: ext ? ext.slice(0, 4).toUpperCase() : "FILE", bg: "#F1F5F9", fg: "#64748B" };
}

// Convierte el valor de un <input type="datetime-local"> en un texto
// legible tipo "Martes 5 de agosto, 11:59 p. m."
function formatFechaBonita(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const texto = new Intl.DateTimeFormat("es-CO", {
    weekday: "long", day: "numeric", month: "long",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(d);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Antepone https:// si el usuario no escribió protocolo, para que el
// enlace de preview y el <a href> naveguen a la página real.
function getFullUrl(url = "") {
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

// Extrae el dominio de una URL para mostrarlo como preview mientras el
// usuario escribe un enlace de referencia. Devuelve null si la URL aún
// no es válida (mientras el usuario todavía está escribiendo).
function getDomain(url = "") {
  const full = getFullUrl(url);
  if (!full) return null;
  try {
    return new URL(full).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/* ── Estilo compartido de botones de ícono dentro del modal de preview ── */
const iconBtnStyle = {
  width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent",
  color: "var(--color-text-muted)", cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0,
};

/* ── Modal de vista previa con zoom ───────────────────────────────────
   Se adapta al tipo de documento:
   - Imagen: zoom con escala CSS sobre el <img>.
   - PDF: se embebe en <iframe> (funciona tanto con URLs reales como con
     blobs locales de archivos recién adjuntados) y el zoom se logra
     escalando el iframe.
   - Cualquier otro tipo: no hay preview nativo posible en el navegador,
     así que se muestra la insignia del archivo y un botón para abrirlo
     en una pestaña nueva.
────────────────────────────────────────────────────────────────────── */
function PreviewModal({ item, onClose }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1);
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [item, onClose]);

  if (!item) return null;

  const zoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const resetZoom = () => setZoom(1);
  const canZoom = item.isImage || item.isPdf;
  const badge = getFileBadge(item.name);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--color-bg)", borderRadius: 12,
          width: "min(900px, 100%)", maxHeight: "90vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 12px", borderBottom: "1px solid var(--color-border)",
        }}>
          <FileText size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <p title={item.name} style={{
            margin: 0, fontSize: 13, fontWeight: 700, flex: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.name}
          </p>

          {canZoom && (
            <>
              <button type="button" onClick={zoomOut} title="Alejar" style={iconBtnStyle}>
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", width: 42, textAlign: "center" }}>
                {Math.round(zoom * 100)}%
              </span>
              <button type="button" onClick={zoomIn} title="Acercar" style={iconBtnStyle}>
                <ZoomIn size={16} />
              </button>
              <button type="button" onClick={resetZoom} title="Restablecer zoom" style={iconBtnStyle}>
                <RotateCcw size={16} />
              </button>
            </>
          )}

          <a href={item.url} target="_blank" rel="noreferrer" title="Abrir en nueva pestaña" style={iconBtnStyle}>
            <ExternalLink size={16} />
          </a>

          <button type="button" onClick={onClose} title="Cerrar" style={{ ...iconBtnStyle, marginLeft: 2 }}>
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, overflow: "auto", background: "var(--color-bg-secondary, #f3f4f6)" }}>
          {item.isImage ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 20 }}>
              <img
                src={item.url}
                alt={item.name}
                style={{
                  transform: `scale(${zoom})`, transformOrigin: "center",
                  transition: "transform 120ms", maxWidth: zoom <= 1 ? "100%" : "none",
                  maxHeight: zoom <= 1 ? "70vh" : "none",
                }}
              />
            </div>
          ) : item.isPdf ? (
            <div style={{ height: "70vh", overflow: "auto" }}>
              <iframe
                src={item.url}
                title={item.name}
                style={{
                  width: `${100 / zoom}%`, height: `${100 / zoom}%`, minHeight: "70vh",
                  border: "none", transform: `scale(${zoom})`, transformOrigin: "top left",
                }}
              />
            </div>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minHeight: "40vh", gap: 10, padding: 30, textAlign: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12, display: "flex", alignItems: "center",
                justifyContent: "center", background: badge.bg,
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: badge.fg }}>{badge.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                Vista previa no disponible para este tipo de archivo
              </p>
              <a
                href={item.url} target="_blank" rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4,
                  padding: "7px 14px", borderRadius: 8, background: "var(--color-primary)",
                  color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none",
                }}
              >
                <ExternalLink size={14} /> Abrir en nueva pestaña
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tarjeta de archivo (imagen, o insignia de color + nombre) ───────
   Se usa tanto para archivos nuevos (con preview en memoria) como para
   archivos ya subidos (con URL real). El botón de eliminar/marcar va
   arriba a la derecha; si hay `onPreview`, aparece un botón de ojo
   arriba a la izquierda que abre el modal de vista previa con zoom,
   en vez de navegar directamente. */
function FileCard({ name, sizeLabel, isImage, isPdf, imageUrl, href, marked = false, onAction, actionTitle = "Quitar", onPreview }) {
  const badge = !isImage ? getFileBadge(name) : null;

  const thumb = (
    <>
      <div style={{
        height: 72, display: "flex", alignItems: "center", justifyContent: "center",
        background: isImage ? "var(--color-bg)" : badge.bg,
      }}>
        {isImage ? (
          <img src={imageUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 12.5, fontWeight: 800, color: badge.fg, letterSpacing: 0.3 }}>
            {badge.label}
          </span>
        )}
      </div>
      <div style={{ padding: "6px 8px" }}>
        <p title={name} style={{
          margin: 0, fontSize: 11.5, fontWeight: 600,
          color: href ? "var(--color-primary)" : "var(--color-text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {name}
        </p>
        {sizeLabel && (
          <p style={{ margin: 0, fontSize: 10.5, color: "var(--color-text-muted)" }}>{sizeLabel}</p>
        )}
      </div>
    </>
  );

  return (
    <div style={{
      position: "relative",
      border: `1.5px solid ${marked ? "var(--color-error)" : "var(--color-border)"}`,
      borderRadius: 10, overflow: "hidden",
      background: marked ? "rgba(239,68,68,0.04)" : "var(--color-bg)",
      opacity: marked ? 0.55 : 1,
      transition: "all 150ms",
    }}>
      {onPreview && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPreview(); }}
          title="Vista previa"
          style={{
            position: "absolute", top: 6, left: 6, zIndex: 1,
            width: 22, height: 22, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: "pointer",
            background: "rgba(0,0,0,0.55)", color: "#fff",
          }}
        >
          <Eye size={12} />
        </button>
      )}

      <button
        type="button"
        onClick={onAction}
        title={actionTitle}
        style={{
          position: "absolute", top: 6, right: 6, zIndex: 1,
          width: 22, height: 22, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", cursor: "pointer",
          background: marked ? "var(--color-error)" : "rgba(0,0,0,0.55)", color: "#fff",
        }}
      >
        <X size={12} />
      </button>

      {href ? (
        <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          {thumb}
        </a>
      ) : thumb}
    </div>
  );
}

/* ── Preview de un archivo recién seleccionado (aún no subido) ──────
   Genera una URL de objeto en memoria para imágenes y PDFs, así el
   botón de vista previa también funciona antes de subir el archivo. */
function NewFilePreview({ file, onRemove, onPreview }) {
  const isImage = file.type?.startsWith("image/");
  const isPdf = file.type === "application/pdf" || isPdfName(file.name);
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!isImage && !isPdf) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage, isPdf]);

  return (
    <FileCard
      name={file.name}
      sizeLabel={`${(file.size / 1024).toFixed(1)} KB`}
      isImage={isImage}
      isPdf={isPdf}
      imageUrl={url}
      onAction={onRemove}
      actionTitle="Quitar archivo"
      onPreview={url ? () => onPreview({ name: file.name, url, isImage, isPdf }) : null}
    />
  );
}

/* ── Editor de etiquetas tipo "chips" ─────────────────────────────────
   Reemplaza al viejo <Input> de texto separado por comas.

   Por qué el viejo enfoque fallaba:
   El input era controlado y su `value` se recalculaba en cada render
   desde `etiquetas.join(", ")`, pero `updateEtiquetas` filtraba strings
   vacíos con `.filter(Boolean)`. Al escribir una coma, el split producía
   un elemento vacío al final que el filter eliminaba de inmediato,
   así que el re-render borraba la coma recién tecleada antes de que el
   usuario pudiera seguir escribiendo la segunda etiqueta.

   Este componente evita el problema por completo: las etiquetas ya
   confirmadas se muestran como chips (no se re-derivan de texto), y hay
   un input de texto aparte solo para lo que se está escribiendo. La
   etiqueta se confirma con Enter, coma, o al perder el foco.
────────────────────────────────────────────────────────────────────── */
function TagsInput({ tags, onChange, placeholder }) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  const commitTag = (raw) => {
    const value = raw.trim();
    setInputValue("");
    if (!value) return;
    if (tags.some(t => t.toLowerCase() === value.toLowerCase())) return;
    onChange([...tags, value]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag(inputValue);
      return;
    }
    // Backspace con el input vacío borra la última etiqueta confirmada,
    // patrón estándar de los editores de tags.
    if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) commitTag(inputValue);
  };

  const removeTag = (idx) => onChange(tags.filter((_, i) => i !== idx));

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
        padding: "7px 8px", minHeight: 42,
        border: "1.5px solid var(--color-border)", borderRadius: 9,
        cursor: "text", background: "var(--color-bg)",
      }}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 6px 3px 10px", borderRadius: 999,
            background: "var(--color-primary-light)", color: "var(--color-primary)",
            fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", lineHeight: 1.6,
          }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(i); }}
            title="Quitar etiqueta"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "inherit", display: "flex", padding: 0, opacity: 0.7,
            }}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? placeholder : ""}
        style={{
          flex: 1, minWidth: 100, border: "none", outline: "none",
          background: "transparent", fontSize: 13, color: "var(--color-text)",
          padding: "3px 4px",
        }}
      />
    </div>
  );
}

/* ── Editor de enlaces con confirmación explícita ─────────────────────
   Antes: cada enlace nuevo era una fila "draft" siempre editable (URL +
   Nombre) con un botón ✕ que borraba la fila completa. El problema: no
   había ninguna diferencia visual ni de estado entre "enlace que ya
   agregué" y "enlace que todavía estoy escribiendo" — la ✕ se sentía
   inútil porque solo borraba un borrador, nunca confirmaba nada.

   Ahora: hay un único campo de captura (URL + Nombre opcional) con un
   botón de confirmación (✓, deshabilitado hasta que la URL sea válida).
   Al confirmar, el enlace se agrega a una lista de enlaces YA
   confirmados — cada uno con su propia ✕ que sí funciona de verdad,
   porque son enlaces que aún no se enviaron al servidor (a diferencia
   de los "Enlaces existentes" ya guardados, que son de solo lectura por
   la limitación de backend explicada arriba). El campo de captura se
   limpia después de cada confirmación, listo para el siguiente. Mismo
   patrón que TagsInput.
────────────────────────────────────────────────────────────────────── */
function EnlacesInput({ enlaces, onChange }) {
  const [urlDraft, setUrlDraft] = useState("");
  const [nombreDraft, setNombreDraft] = useState("");

  const domainDraft = getDomain(urlDraft);
  const puedeConfirmar = Boolean(domainDraft);
  const mostrarInvalido = urlDraft.trim().length > 0 && !domainDraft;

  const commitEnlace = () => {
    if (!puedeConfirmar) return;
    onChange([...enlaces, { url: urlDraft.trim(), nombre: nombreDraft.trim() }]);
    setUrlDraft("");
    setNombreDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEnlace();
    }
  };

  const removeEnlace = (i) => onChange(enlaces.filter((_, idx) => idx !== i));

  return (
    <div>
      {/* Enlaces ya confirmados */}
      {enlaces.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {enlaces.map((enlace, i) => {
            const domain = getDomain(enlace.url);
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", border: "1.5px solid var(--color-border)",
                  borderRadius: 10, background: "var(--color-bg)",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "var(--color-primary-light)",
                }}>
                  <Link2 size={14} style={{ color: "var(--color-primary)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a
                    href={getFullUrl(enlace.url) || enlace.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-primary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none",
                    }}
                  >
                    {enlace.nombre || domain || enlace.url}
                  </a>
                  {domain && (
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{domain}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeEnlace(i)}
                  title="Quitar enlace"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-error)", display: "flex", padding: 4,
                    borderRadius: 6, flexShrink: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Captura de un enlace nuevo — se confirma con ✓ o Enter */}
      <div style={{
        border: "1.5px solid var(--color-border)", borderRadius: 10, padding: 10,
        background: "var(--color-bg)",
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            value={urlDraft}
            onChange={e => setUrlDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://..."
          />
          <Input
            value={nombreDraft}
            onChange={e => setNombreDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre (opcional)"
          />
          <button
            type="button"
            onClick={commitEnlace}
            disabled={!puedeConfirmar}
            title="Agregar enlace"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, borderRadius: 8, border: "none", flexShrink: 0,
              background: puedeConfirmar ? "var(--color-primary)" : "var(--color-border)",
              color: "#fff", cursor: puedeConfirmar ? "pointer" : "not-allowed",
              transition: "background 150ms",
            }}
          >
            <Check size={16} />
          </button>
        </div>

        {domainDraft && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginTop: 8,
            padding: "6px 10px", borderRadius: 8, background: "var(--color-primary-light)",
          }}>
            <Link2 size={12} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
            <span style={{
              fontSize: 12, fontWeight: 600, color: "var(--color-primary)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {nombreDraft.trim() || domainDraft}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: "auto", flexShrink: 0 }}>
              {domainDraft}
            </span>
          </div>
        )}
        {mostrarInvalido && (
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--color-error)" }}>
            Ingresa una URL válida
          </p>
        )}
        <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--color-text-muted)" }}>
          Escribe la URL y presiona ✓ (o Enter) para agregarla
        </p>
      </div>
    </div>
  );
}

/* ── Formulario principal ─────────────────────────────────────────── */
/*
  Forma esperada de `form` (alineada 1:1 con tareaSchema del backend):
  {
    titulo: "",
    descripcion: "",
    criterios: "",              // antes llamado "instrucciones", sin respaldo real
    etiquetas: [],               // String[] en el schema
    moduloId: "",                // OBLIGATORIO al crear (createTareaValidator), opcional al editar
    fechaEntrega: "",
    tipoEntrega: "archivo",
    asignacionTipo: "todos",
    participantes: [],           // se mapea a participantesSeleccionados al enviar
    archivosNuevos: [],
    enlacesNuevos: [{ url: "...", nombre: "..." }], // solo enlaces YA confirmados con ✓,
                                  // nunca filas a medio escribir (ver EnlacesInput)
    archivosEliminar: [],        // publicIds a quitar de archivosAdjuntos
    enlacesExistentes: [],       // precargado desde tarea.soloEnlaces al editar

    // NOTA: se eliminó "enlacesEliminar". El backend (updateTarea) solo sabe
    // eliminar adjuntos comparando por publicId (archivosAEliminar), y los
    // enlaces nunca tienen publicId — no hay ningún campo que el controller
    // lea para eliminar un enlace existente. Por eso los enlaces existentes
    // se muestran aquí en modo solo lectura: mostrar un botón de "eliminar"
    // que no elimina nada tras guardar es peor que no tenerlo. Si se agrega
    // soporte de eliminación en el backend (por ejemplo comparando por url),
    // este campo y su UI se pueden reintroducir.
  }

  NOTA: se eliminaron `puntajeMaximo` y `permiteEntregaTardia` porque no
  existen en tareaSchema (backend). Si se necesitan, deben agregarse primero
  al modelo de Mongoose y al controlador antes de reintroducirlos aquí.

  NOTA IMPORTANTE (moduloId): createTareaValidator.js exige moduloId como
  MongoId no vacío al crear una tarea (`.notEmpty()... .isMongoId()`).
  updateTareaValidator.js lo marca como `.optional()`. Por eso el campo se
  vuelve obligatorio solo cuando NO se está editando (editTarget es null).
*/
export default function TareaForm({
  form, setForm,
  errors = {}, setErrors,
  editTarget,
  participantesCurso, loadingParts,
  modulos = [], loadingModulos = false,
  onSubmit,
}) {
  const fileRef = useRef(null);
  const esEdicion = Boolean(editTarget);
  const [previewItem, setPreviewItem] = useState(null);

  // Limpia el error de un campo apenas el usuario empieza a corregirlo,
  // así el mensaje no queda pegado tras el primer intento fallido.
  const clearError = (key) => {
    if (errors[key] && setErrors) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const set = (key) => (e) => {
    clearError(key);
    setForm(f => ({ ...f, [key]: e.target.value }));
  };

  const toggleParticipante = (id) => {
    clearError("participantes");
    setForm(f => ({
      ...f,
      participantes: f.participantes.includes(id)
        ? f.participantes.filter(p => p !== id)
        : [...f.participantes, id],
    }));
  };

  const toggleArchivoEliminar = (pid) =>
    setForm(f => ({
      ...f,
      archivosEliminar: f.archivosEliminar.includes(pid)
        ? f.archivosEliminar.filter(p => p !== pid)
        : [...f.archivosEliminar, pid],
    }));

  const handleFileAdd = (e) => {
    // Capturar los archivos ANTES de resetear el input.
    // e.target.files es una FileList viva: si el reset ocurre antes de que
    // React ejecute el updater, el array quedaría vacío.
    const captured = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (captured.length === 0) return;
    setForm(f => ({ ...f, archivosNuevos: [...f.archivosNuevos, ...captured] }));
  };

  const removeArchivoNuevo = (i) =>
    setForm(f => ({ ...f, archivosNuevos: f.archivosNuevos.filter((_, idx) => idx !== i) }));

  // Fallback defensivo: en TareasTab.jsx (openEdit), los enlaces existentes
  // se leen con `t.adjuntos ?? t.archivosAdjuntos`, lo que sugiere que
  // normalizeTarea podría estar renombrando el campo a "adjuntos". Se aplica
  // el mismo fallback aquí para que la lista de archivos no quede vacía si
  // ese es el caso — confirmar contra normalizeTarea y simplificar a un solo
  // nombre una vez que se sepa cuál es el real.
  const archivosExistentes = (editTarget?.adjuntos ?? editTarget?.archivosAdjuntos ?? []).filter(a => a.tipo === "archivo");
  const enlacesExistentes = form.enlacesExistentes ?? [];

  // Mínimo permitido para el input datetime-local: ahora mismo,
  // así el usuario ve la restricción antes de intentar guardar.
  const minFechaEntrega = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <>
      <form
        id="tarea-form"
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        {/* Título */}
        <div>
          <Input
            label="Título *"
            value={form.titulo}
            onChange={set("titulo")}
            placeholder="Nombre del reto"
            required
          />
          <FieldError message={errors.titulo} />
        </div>

        {/* Descripción */}
        <Textarea
          label="Descripción"
          value={form.descripcion}
          onChange={set("descripcion")}
          rows={3}
          placeholder="Instrucciones para los participantes..."
        />

        {/* Criterios de evaluación — campo real del schema (antes llamado
            "instrucciones" en el form, sin respaldo en el backend) */}
        <div>
          <Textarea
            label="Criterios de evaluación"
            value={form.criterios}
            onChange={set("criterios")}
            rows={3}
            placeholder="Criterios específicos, formato esperado..."
          />
          <FieldError message={errors.criterios} />
        </div>

        {/* Etiquetas — String[] en tareaSchema. Editor tipo chips: cada
            etiqueta se confirma con Enter, coma, o al salir del campo. */}
        <Field label="Etiquetas">
          <TagsInput
            tags={form.etiquetas ?? []}
            onChange={(next) => setForm(f => ({ ...f, etiquetas: next }))}
            placeholder="ej: matemáticas, urgente, proyecto-final"
          />
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "var(--color-text-muted)" }}>
            Presiona Enter o coma para agregar una etiqueta
          </p>
        </Field>

        {/* Módulo + Fecha */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Select
              label={esEdicion ? "Módulo" : "Módulo *"}
              value={form.moduloId}
              onChange={set("moduloId")}
              disabled={loadingModulos}
              required={!esEdicion}
            >
              <option value="">
                {loadingModulos
                  ? "Cargando…"
                  : esEdicion
                    ? "Sin módulo"
                    : "Selecciona un módulo"}
              </option>
              {modulos.map(m => <option key={m._id} value={m._id}>{m.titulo}</option>)}
            </Select>
            <FieldError message={errors.moduloId} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--color-text)" }}>
              Fecha de entrega *
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              border: `1.5px solid ${errors.fechaEntrega ? "var(--color-error)" : "var(--color-border)"}`,
              borderRadius: 9, padding: "8px 10px", background: "var(--color-bg)",
              transition: "border-color 150ms",
            }}>
              <Calendar size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
              <input
                type="datetime-local"
                min={minFechaEntrega}
                value={form.fechaEntrega}
                onChange={set("fechaEntrega")}
                required
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  fontSize: 13, color: "var(--color-text)", padding: "3px 0", minWidth: 0,
                }}
              />
            </div>
            {formatFechaBonita(form.fechaEntrega) && (
              <p style={{
                margin: "6px 0 0", fontSize: 12, fontWeight: 600, color: "var(--color-primary)",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Clock size={11} style={{ flexShrink: 0 }} />
                Vence: {formatFechaBonita(form.fechaEntrega)}
              </p>
            )}
            <FieldError message={errors.fechaEntrega} />
          </div>
        </div>

        {/* Tipo de entrega */}
        <Select
          label="Tipo de entrega"
          value={form.tipoEntrega}
          onChange={set("tipoEntrega")}
        >
          {TIPO_ENTREGA_OPTS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>

        {/* Asignación */}
        <Field label="Asignar a">
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { value: "todos",         Icon: Globe, text: "Todos" },
              { value: "seleccionados", Icon: Users, text: "Seleccionados" },
            ].map(({ value, Icon, text }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  clearError("participantes");
                  setForm(f => ({ ...f, asignacionTipo: value, participantes: [] }));
                }}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, fontWeight: 700,
                  border: "1.5px solid", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6, cursor: "pointer",
                  borderColor: form.asignacionTipo === value ? "var(--color-primary)" : "var(--color-border)",
                  background:  form.asignacionTipo === value ? "var(--color-primary-light)" : "var(--color-bg)",
                  color:       form.asignacionTipo === value ? "var(--color-primary)" : "var(--color-text-muted)",
                }}
              >
                <Icon style={{ width: 14, height: 14 }} />
                {text}
              </button>
            ))}
          </div>
        </Field>

        {/* Participantes seleccionados */}
        {form.asignacionTipo === "seleccionados" && (
          <Field label={`Participantes — ${form.participantes.length} seleccionados`}>
            {loadingParts ? <Sk h={90} r={8} /> :
              participantesCurso.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0 }}>
                  Sin participantes
                </p>
              ) : (
                <div style={{
                  maxHeight: 180, overflowY: "auto",
                  border: `1.5px solid ${errors.participantes ? "var(--color-error)" : "var(--color-border)"}`,
                  borderRadius: 9,
                }}>
                  {participantesCurso.map(p => (
                    <div
                      key={p._id}
                      onClick={() => toggleParticipante(p._id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "7px 10px", cursor: "pointer",
                        background: form.participantes.includes(p._id)
                          ? "var(--color-primary-light)"
                          : "transparent",
                      }}
                    >
                      <Checkbox
                        size="sm"
                        checked={form.participantes.includes(p._id)}
                        onChange={() => toggleParticipante(p._id)}
                      />
                      <span style={{ flex: 1, fontSize: 13 }}>{p.nombre} {p.apellido}</span>
                    </div>
                  ))}
                </div>
              )
            }
            <FieldError message={errors.participantes} />
          </Field>
        )}

        {/* Archivos existentes (edición) */}
        {editTarget && archivosExistentes.length > 0 && (
          <Field label="Archivos existentes">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
              {archivosExistentes.map((adj, i) => {
                const marcado = form.archivosEliminar.includes(adj.publicId);
                const esImagen = isImageName(adj.nombre);
                const esPdf = isPdfName(adj.nombre);
                return (
                  <FileCard
                    key={adj.publicId ?? i}
                    name={adj.nombre}
                    isImage={esImagen}
                    isPdf={esPdf}
                    imageUrl={adj.url}
                    href={adj.url}
                    marked={marcado}
                    onAction={() => toggleArchivoEliminar(adj.publicId)}
                    actionTitle={marcado ? "Deshacer eliminación" : "Marcar para eliminar"}
                    onPreview={() => setPreviewItem({ name: adj.nombre, url: adj.url, isImage: esImagen, isPdf: esPdf })}
                  />
                );
              })}
            </div>
          </Field>
        )}

        {/* Adjuntar archivos nuevos */}
        <Field label="Adjuntar archivos">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            style={{ display: "none" }}
            onChange={handleFileAdd}
          />

          <div
            onClick={() => fileRef.current?.click()}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-primary)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border)"}
            style={{
              border: "2px dashed var(--color-border)", borderRadius: 10,
              padding: "14px 20px", textAlign: "center", cursor: "pointer",
              background: "var(--color-bg)", transition: "border-color 150ms",
            }}
          >
            <Upload size={18} style={{ color: "var(--color-text-muted)", margin: "0 auto 4px", display: "block" }} />
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
              Clic para adjuntar · Imágenes, PDF, Word, Excel…
            </p>
          </div>

          {form.archivosNuevos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, marginTop: 8 }}>
              {form.archivosNuevos.map((f, i) => (
                <NewFilePreview key={i} file={f} onRemove={() => removeArchivoNuevo(i)} onPreview={setPreviewItem} />
              ))}
            </div>
          )}
        </Field>

        {/* Enlaces existentes (edición) — precargados desde tarea.soloEnlaces,
            que es un virtual derivado de archivosAdjuntos filtrado por
            tipo: 'enlace'. Se muestran EN SOLO LECTURA (sin botón de
            eliminar): updateTarea (backend) no tiene ningún mecanismo para
            eliminar un enlace existente — archivosAEliminar solo compara por
            publicId, campo que los enlaces nunca tienen. Un botón de
            "eliminar" aquí simulaba una función que no persistía tras
            guardar, lo cual es peor que no ofrecerla. Si se quiere reemplazar
            un enlace, la única vía disponible hoy es agregarlo de nuevo con
            otro texto en "Enlace de referencia" más abajo. */}
        {editTarget && enlacesExistentes.length > 0 && (
          <Field label="Enlaces existentes">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {enlacesExistentes.map((enlace, i) => {
                const domain = getDomain(enlace.url);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px",
                      border: "1.5px solid var(--color-border)",
                      borderRadius: 10,
                      background: "var(--color-bg)",
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "var(--color-primary-light)",
                    }}>
                      <Link2 size={14} style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a
                        href={getFullUrl(enlace.url) || enlace.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-primary)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none",
                        }}
                      >
                        {enlace.nombre || domain || enlace.url}
                      </a>
                      {domain && (
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{domain}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--color-text-muted)" }}>
              Los enlaces existentes no se pueden eliminar por ahora — requiere soporte del backend.
            </p>
          </Field>
        )}

        {/* Enlaces nuevos — captura con confirmación (✓), no filas draft
            editables. Ver EnlacesInput arriba para el porqué del cambio. */}
        <Field label="Enlace de referencia">
          <EnlacesInput
            enlaces={form.enlacesNuevos}
            onChange={(next) => setForm(f => ({ ...f, enlacesNuevos: next }))}
          />
        </Field>
      </form>

      <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </>
  );
}