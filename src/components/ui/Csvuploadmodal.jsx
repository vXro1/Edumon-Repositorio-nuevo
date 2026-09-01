// modal reutilizable de carga masiva CSV, agnóstico al dominio — recibe
// onUpload(File) y onDownloadTemplate()

import { useRef, useState, useCallback, useEffect } from "react";
import { AppModal, Button } from "@/components";

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
  const [result, setResult] = useState(null);

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

  const fallidos = result?.fallidos ?? result?.errores ?? 0;

  return (
    <AppModal isOpen={isOpen} onClose={onClose} size="md">
      <AppModal.Header title={title} description={description} onClose={onClose} />
      <AppModal.Body>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Plantilla + columnas hint */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
        }}>
          {acceptedColumns.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {acceptedColumns.map((col) => (
                <span key={col} style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 20,
                  background: "var(--color-bg)",
                  color: "var(--color-text-muted)",
                  fontFamily: "monospace", fontWeight: 500,
                  border: "1px solid var(--color-border)",
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
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-primary)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {ICONS.download}
              {templateLabel}
            </button>
          )}
        </div>

        {/* Zona de soltar archivos */}
        {status !== STATUS.SUCCESS && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${
                dragging || file ? "var(--color-primary)" : "var(--color-border)"
              }`,
              borderRadius: 12,
              padding: "28px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: dragging || file
                ? "var(--color-primary-light)"
                : "var(--color-bg)",
              transition: "all 0.18s ease",
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
                <div style={{ color: "var(--color-primary)" }}>{ICONS.file}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    color: "var(--color-text)", maxWidth: 260,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {file.name}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    aria-label="Quitar archivo"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--color-text-muted)", padding: 2,
                      display: "flex", alignItems: "center", borderRadius: 4,
                    }}
                  >
                    {ICONS.trash}
                  </button>
                </div>
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  {(file.size / 1024).toFixed(1)} KB · Haz clic para cambiar
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ color: "var(--color-text-muted)" }}>{ICONS.upload}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                    Arrastra tu archivo aquí
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
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
            padding: "14px 16px",
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: 10, display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: "2.5px solid var(--color-primary)",
              borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Procesando el archivo…
            </span>
          </div>
        )}

        {/* Estado: Error */}
        {status === STATUS.ERROR && errorMsg && (
          <div style={{
            padding: "12px 14px",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <span style={{ color: "var(--color-error)", flexShrink: 0, marginTop: 1 }}>
              {ICONS.error}
            </span>
            <span style={{ fontSize: 13, color: "var(--color-error)", lineHeight: 1.5 }}>
              {errorMsg}
            </span>
          </div>
        )}

        {/* Estado: Éxito */}
        {status === STATUS.SUCCESS && <SuccessPanel result={result} />}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </AppModal.Body>
      <AppModal.Footer>
        {status !== STATUS.SUCCESS ? (
          <>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button
              disabled={!file || status === STATUS.UPLOADING}
              onClick={handleSubmit}
            >
              {status === STATUS.UPLOADING ? "Subiendo…" : "Cargar archivo"}
            </Button>
          </>
        ) : (
          <>
            {fallidos > 0 && (
              <Button variant="ghost" onClick={handleReset}>Subir otro archivo</Button>
            )}
            <Button onClick={onClose}>Listo</Button>
          </>
        )}
      </AppModal.Footer>
    </AppModal>
  );
}

// ─── Panel de resultado exitoso ───────────────────────────────────────────────
function SuccessPanel({ result }) {
  const total    = result?.total     ?? result?.procesados ?? "—";
  const exitosos = result?.exitosos  ?? result?.creados    ?? "—";
  const fallidos = result?.fallidos  ?? result?.errores    ?? 0;
  const detalle  = result?.detalle   ?? result?.erroresDetalle ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        padding: "20px", borderRadius: 12, textAlign: "center",
        background: "rgba(65,217,88,0.08)",
        border: "1px solid rgba(65,217,88,0.30)",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--color-success)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px", color: "white",
        }}>
          {ICONS.check}
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: "var(--color-success)" }}>
          Carga completada
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
          {[
            { label: "Total",     value: total    },
            { label: "Creados",   value: exitosos, success: true },
            { label: "Con error", value: fallidos, error: fallidos > 0 },
          ].map(({ label, value, success, error }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 22, fontWeight: 700,
                color: error ? "var(--color-error)"
                     : success ? "var(--color-success)"
                     : "var(--color-text)",
              }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {detalle.length > 0 && (
        <details>
          <summary style={{
            cursor: "pointer", fontSize: 13, fontWeight: 600,
            color: "var(--color-error)", padding: "8px 0", userSelect: "none",
          }}>
            Ver filas con errores ({detalle.length})
          </summary>
          <ul style={{
            margin: "8px 0 0", padding: 0, listStyle: "none",
            maxHeight: 160, overflowY: "auto",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 8, fontSize: 12,
          }}>
            {detalle.map((d, i) => (
              <li key={i} style={{
                padding: "8px 12px",
                borderBottom: i < detalle.length - 1
                  ? "1px solid var(--color-border)" : "none",
                color: "var(--color-text)",
              }}>
                <span style={{ fontWeight: 600 }}>
                  Fila {d.fila ?? d.row ?? i + 2}:
                </span>{" "}
                {d.error ?? d.mensaje ?? "Error desconocido"}
              </li>
            ))}
          </ul>
        </details>
      )}

    </div>
  );
}
