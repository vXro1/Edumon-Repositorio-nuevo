// src/components/ui/CsvUploadModal.jsx
//
// Modal reutilizable para carga masiva de archivos CSV.
// Diseñado para ser agnóstico al dominio: recibe onUpload (async fn que
// acepta un File) y onDownloadTemplate (fn que descarga la plantilla).
//
// Props:
//   isOpen            {boolean}   — controla visibilidad
//   onClose           {fn}        — cierra el modal
//   onUpload          {async fn}  — recibe el File seleccionado; debe lanzar
//                                   error con message en caso de fallo
//   onDownloadTemplate{fn}        — dispara descarga de la plantilla CSV
//   title             {string}    — título del modal (default: "Carga masiva CSV")
//   description       {string}    — descripción opcional bajo el título
//   templateLabel     {string}    — texto del botón de plantilla
//   acceptedColumns   {string[]}  — lista de columnas esperadas para hint visual
//   maxFileSizeMB     {number}    — límite en MB (default: 5)

import React, { useRef, useState, useCallback, useEffect } from "react";

const ICONS = {
  upload: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  file: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  download: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  trash: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
};

// ─── Estados del proceso ───────────────────────────────────────────────────
const STATUS = { IDLE: "idle", UPLOADING: "uploading", SUCCESS: "success", ERROR: "error" };

export default function CsvUploadModal({
  isOpen,
  onClose,
  onUpload,
  onDownloadTemplate,
  title = "Carga masiva CSV",
  description,
  templateLabel = "Descargar plantilla",
  acceptedColumns = [],
  maxFileSizeMB = 5,
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null); // { total, exitosos, fallidos, detalle[] }

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFile(null);
        setStatus(STATUS.IDLE);
        setErrorMsg("");
        setResult(null);
        setDragging(false);
      }, 300);
    }
  }, [isOpen]);

  const validateFile = useCallback((f) => {
    if (!f) return "No se seleccionó ningún archivo.";
    if (!f.name.endsWith(".csv")) return "El archivo debe tener extensión .csv";
    if (f.size > maxFileSizeMB * 1024 * 1024)
      return `El archivo supera el límite de ${maxFileSizeMB} MB.`;
    return null;
  }, [maxFileSizeMB]);

  const handleFileChange = useCallback((f) => {
    const err = validateFile(f);
    if (err) {
      setErrorMsg(err);
      setStatus(STATUS.ERROR);
      return;
    }
    setFile(f);
    setErrorMsg("");
    setStatus(STATUS.IDLE);
    setResult(null);
  }, [validateFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) handleFileChange(dropped);
  }, [handleFileChange]);

  const handleSubmit = async () => {
    if (!file) return;
    setStatus(STATUS.UPLOADING);
    setErrorMsg("");
    try {
      const res = await onUpload(file);
      setResult(res ?? null);
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      setErrorMsg(err?.message ?? "Error al procesar el archivo.");
      setStatus(STATUS.ERROR);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus(STATUS.IDLE);
    setErrorMsg("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ── Overlay ── */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          animation: "fadeIn 0.18s ease",
        }}
      />

      {/* ── Panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="csv-modal-title"
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          width: "min(520px, 94vw)",
          background: "var(--color-background-primary, #fff)",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
          overflow: "hidden",
          animation: "slideUp 0.22s cubic-bezier(.25,.8,.25,1)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <h2
              id="csv-modal-title"
              style={{ margin: 0, fontSize: 16, fontWeight: 600,
                color: "var(--color-text-primary, #111)" }}
            >
              {title}
            </h2>
            {description && (
              <p style={{ margin: "4px 0 0", fontSize: 13,
                color: "var(--color-text-secondary, #6b7280)", lineHeight: 1.5 }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 4,
              color: "var(--color-text-secondary, #9ca3af)",
              borderRadius: 6, display: "flex", alignItems: "center",
              transition: "color 0.15s",
            }}
          >
            {ICONS.close}
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>

          {/* Plantilla + columnas hint */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 16, flexWrap: "wrap", gap: 10,
          }}>
            {acceptedColumns.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {acceptedColumns.map((col) => (
                  <span key={col} style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 20,
                    background: "var(--color-background-secondary, #f3f4f6)",
                    color: "var(--color-text-secondary, #6b7280)",
                    fontFamily: "monospace", fontWeight: 500,
                  }}>
                    {col}
                  </span>
                ))}
              </div>
            )}
            {onDownloadTemplate && (
              <button
                onClick={onDownloadTemplate}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 8,
                  border: "1px solid var(--color-border-tertiary, #e5e7eb)",
                  background: "var(--color-background-primary, #fff)",
                  color: "var(--color-text-info, #2563eb)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}
              >
                {ICONS.download}
                {templateLabel}
              </button>
            )}
          </div>

          {/* Drop zone */}
          {status !== STATUS.SUCCESS && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging
                  ? "var(--color-text-info, #2563eb)"
                  : file
                    ? "var(--color-text-info, #2563eb)"
                    : "var(--color-border-tertiary, #d1d5db)"}`,
                borderRadius: 12,
                padding: "28px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging
                  ? "var(--color-background-info, #eff6ff)"
                  : file
                    ? "var(--color-background-info, #eff6ff)"
                    : "var(--color-background-secondary, #f9fafb)",
                transition: "all 0.18s ease",
                position: "relative",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />

              {file ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ color: "var(--color-text-info, #2563eb)" }}>{ICONS.file}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500,
                      color: "var(--color-text-primary, #111)", maxWidth: 260,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      aria-label="Quitar archivo"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--color-text-secondary, #9ca3af)", padding: 2,
                        display: "flex", alignItems: "center", borderRadius: 4,
                      }}
                    >
                      {ICONS.trash}
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary, #9ca3af)" }}>
                    {(file.size / 1024).toFixed(1)} KB · Haz clic para cambiar
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ color: "var(--color-text-secondary, #9ca3af)" }}>{ICONS.upload}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500,
                      color: "var(--color-text-primary, #374151)" }}>
                      Arrastra tu archivo aquí
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 12,
                      color: "var(--color-text-secondary, #9ca3af)" }}>
                      o haz clic para seleccionar · Solo .csv · Máx {maxFileSizeMB} MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Estado: Cargando */}
          {status === STATUS.UPLOADING && (
            <div style={{
              marginTop: 16, padding: "14px 16px",
              background: "var(--color-background-secondary, #f3f4f6)",
              borderRadius: 10, display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                border: "2.5px solid var(--color-text-info, #2563eb)",
                borderTopColor: "transparent",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: "var(--color-text-secondary, #6b7280)" }}>
                Procesando el archivo…
              </span>
            </div>
          )}

          {/* Estado: Error */}
          {status === STATUS.ERROR && errorMsg && (
            <div style={{
              marginTop: 16, padding: "12px 14px",
              background: "var(--color-background-error, #fef2f2)",
              border: "1px solid var(--color-border-error, #fca5a5)",
              borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <span style={{ color: "var(--color-text-error, #dc2626)", flexShrink: 0, marginTop: 1 }}>
                {ICONS.error}
              </span>
              <span style={{ fontSize: 13, color: "var(--color-text-error, #b91c1c)", lineHeight: 1.5 }}>
                {errorMsg}
              </span>
            </div>
          )}

          {/* Estado: Éxito con resumen */}
          {status === STATUS.SUCCESS && (
            <SuccessPanel result={result} onClose={onClose} onReset={handleReset} />
          )}

          {/* Footer acciones */}
          {status !== STATUS.SUCCESS && (
            <div style={{
              marginTop: 20, display: "flex",
              justifyContent: "flex-end", gap: 10,
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  border: "1px solid var(--color-border-tertiary, #e5e7eb)",
                  background: "var(--color-background-primary, #fff)",
                  color: "var(--color-text-secondary, #6b7280)",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!file || status === STATUS.UPLOADING}
                style={{
                  padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  border: "none",
                  background: (!file || status === STATUS.UPLOADING)
                    ? "var(--color-border-tertiary, #d1d5db)"
                    : "var(--color-text-info, #2563eb)",
                  color: (!file || status === STATUS.UPLOADING) ? "#9ca3af" : "white",
                  cursor: (!file || status === STATUS.UPLOADING) ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {status === STATUS.UPLOADING ? "Subiendo…" : "Cargar archivo"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) }
                             to   { opacity: 1; transform: translate(-50%, -50%) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}

// ─── Panel de resultado exitoso ───────────────────────────────────────────────
function SuccessPanel({ result, onClose, onReset }) {
  const total     = result?.total     ?? result?.procesados ?? "—";
  const exitosos  = result?.exitosos  ?? result?.creados    ?? "—";
  const fallidos  = result?.fallidos  ?? result?.errores    ?? 0;
  const detalle   = result?.detalle   ?? result?.erroresDetalle ?? [];

  return (
    <div>
      <div style={{
        padding: "20px", borderRadius: 12, textAlign: "center",
        background: "var(--color-background-success, #f0fdf4)",
        border: "1px solid var(--color-border-success, #86efac)",
        marginBottom: detalle.length ? 16 : 0,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--color-text-success, #16a34a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px", color: "white",
        }}>
          {ICONS.check}
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600,
          color: "var(--color-text-success, #15803d)" }}>
          Carga completada
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
          {[
            { label: "Total",     value: total    },
            { label: "Creados",   value: exitosos, highlight: true },
            { label: "Con error", value: fallidos, warn: fallidos > 0 },
          ].map(({ label, value, highlight, warn }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 22, fontWeight: 700,
                color: warn && value > 0
                  ? "var(--color-text-error, #dc2626)"
                  : highlight
                    ? "var(--color-text-success, #16a34a)"
                    : "var(--color-text-primary, #111)",
              }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary, #9ca3af)",
                marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalle de errores si los hay */}
      {detalle.length > 0 && (
        <details style={{ marginBottom: 16 }}>
          <summary style={{
            cursor: "pointer", fontSize: 13, fontWeight: 500,
            color: "var(--color-text-error, #dc2626)",
            padding: "8px 0", userSelect: "none",
          }}>
            Ver filas con errores ({detalle.length})
          </summary>
          <ul style={{
            margin: "8px 0 0", padding: 0, listStyle: "none",
            maxHeight: 160, overflowY: "auto",
            border: "1px solid var(--color-border-error, #fca5a5)",
            borderRadius: 8, fontSize: 12,
          }}>
            {detalle.map((d, i) => (
              <li key={i} style={{
                padding: "8px 12px",
                borderBottom: i < detalle.length - 1
                  ? "0.5px solid var(--color-border-tertiary, #e5e7eb)" : "none",
                color: "var(--color-text-primary, #374151)",
              }}>
                <span style={{ fontWeight: 500 }}>
                  Fila {d.fila ?? d.row ?? i + 2}:
                </span>{" "}
                {d.error ?? d.mensaje ?? "Error desconocido"}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {fallidos > 0 && (
          <button
            onClick={onReset}
            style={{
              padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: "1px solid var(--color-border-tertiary, #e5e7eb)",
              background: "var(--color-background-primary, #fff)",
              color: "var(--color-text-secondary, #6b7280)", cursor: "pointer",
            }}
          >
            Subir otro archivo
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            border: "none",
            background: "var(--color-text-info, #2563eb)",
            color: "white", cursor: "pointer",
          }}
        >
          Listo
        </button>
      </div>
    </div>
  );
}