// src/components/ui/CsvUploadModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal reutilizable para carga masiva por CSV.
//
// Props:
//   isOpen          boolean           — visibilidad
//   onClose         () => void        — cerrar
//   title           string            — título del modal
//   description     string            — descripción opcional
//   columns         string[]          — columnas de la plantilla, ej: ["titulo","descripcion"]
//   templateName    string            — nombre del archivo a descargar, ej: "plantilla_modulos"
//   onUpload        (rows) => Promise — recibe el array de objetos parseados del CSV
//   exampleRows     object[]          — filas de ejemplo en la plantilla (opcional)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef } from "react";
import { Upload, Download, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Modal, Button } from "@/components";

export default function CsvUploadModal({
  isOpen,
  onClose,
  title = "Carga masiva por CSV",
  description,
  columns = [],
  templateName = "plantilla",
  onUpload,
  exampleRows = [],
}) {
  const [file, setFile]           = useState(null);
  const [rows, setRows]           = useState([]);
  const [errors, setErrors]       = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]       = useState(null);
  const fileRef = useRef(null);

  // ── Descarga plantilla CSV ────────────────────────────────────────────────
  const downloadTemplate = () => {
    const header = columns.join(",");
    const examples = exampleRows.length > 0
      ? exampleRows.map(row => columns.map(c => `"${row[c] ?? ""}"`).join(",")).join("\n")
      : columns.map(() => '""').join(",");
    const csv = `${header}\n${examples}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${templateName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Parseo del CSV ────────────────────────────────────────────────────────
  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { rows: [], errors: ["El archivo no tiene datos."] };

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const missing = columns.filter(c => !headers.includes(c.toLowerCase()));
    if (missing.length > 0) {
      return { rows: [], errors: [`Columnas faltantes: ${missing.join(", ")}`] };
    }

    const parsed = [];
    const errs   = [];

    lines.slice(1).forEach((line, i) => {
      if (!line.trim()) return;
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row  = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });

      const emptyRequired = columns.filter(c => !row[c.toLowerCase()]?.trim());
      if (emptyRequired.length > 0) {
        errs.push(`Fila ${i + 2}: faltan valores en ${emptyRequired.join(", ")}`);
      } else {
        parsed.push(row);
      }
    });

    return { rows: parsed, errors: errs };
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setErrors(["Solo se aceptan archivos .csv"]);
      setFile(null);
      setRows([]);
      return;
    }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows: r, errors: er } = parseCSV(ev.target.result);
      setRows(r);
      setErrors(er);
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!rows.length || !onUpload) return;
    setUploading(true);
    try {
      const res = await onUpload(rows);
      setResult(res ?? { ok: rows.length, failed: 0, messages: [] });
    } catch (err) {
      setResult({ ok: 0, failed: rows.length, messages: [err.message ?? "Error al procesar"] });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setRows([]);
    setErrors([]);
    setResult(null);
    onClose();
  };

  const canUpload = rows.length > 0 && errors.length === 0 && !result;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} description={description} size="md">

      {/* ── Paso 1: Descargar plantilla ── */}
      <div style={{
        background: "var(--color-bg)", borderRadius: 10,
        border: "1px solid var(--color-border)", padding: "14px 16px",
        marginBottom: 16,
      }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
          1. Descarga la plantilla
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 10px" }}>
          Columnas requeridas: <strong>{columns.join(", ")}</strong>
        </p>
        <Button variant="secondary" size="sm" onClick={downloadTemplate}>
          <Download style={{ width: 13, height: 13 }} /> Descargar plantilla
        </Button>
      </div>

      {/* ── Paso 2: Subir archivo ── */}
      <div style={{
        background: "var(--color-bg)", borderRadius: 10,
        border: "1px solid var(--color-border)", padding: "14px 16px",
        marginBottom: 16,
      }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-text)", margin: "0 0 10px" }}>
          2. Sube tu archivo CSV
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${file ? "var(--color-primary)" : "var(--color-border)"}`,
            borderRadius: 10, padding: "24px 16px", textAlign: "center",
            cursor: "pointer", transition: "border-color 150ms",
            background: file ? "var(--color-primary-light)" : "transparent",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-primary)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = file ? "var(--color-primary)" : "var(--color-border)")}
        >
          {file ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <FileText style={{ width: 18, height: 18, color: "var(--color-primary)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Quitar archivo seleccionado"
                onClick={e => {
                  e.stopPropagation();
                  setFile(null);
                  setRows([]);
                  setErrors([]);
                  setResult(null);
                  fileRef.current.value = "";
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </Button>
            </div>
          ) : (
            <>
              <Upload style={{ width: 24, height: 24, color: "var(--color-text-muted)", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                Haz clic para seleccionar un archivo <strong>.csv</strong>
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Errores de validación ── */}
      {errors.length > 0 && (
        <div style={{
          background: "var(--color-error-light)", border: "1px solid var(--color-error)",
          borderRadius: 10, padding: "12px 14px", marginBottom: 16,
        }}>
          {errors.map((err, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: i < errors.length - 1 ? 4 : 0 }}>
              <AlertCircle style={{ width: 13, height: 13, color: "var(--color-error)", flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: "var(--color-error)" }}>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Preview de filas válidas ── */}
      {rows.length > 0 && errors.length === 0 && !result && (
        <div style={{
          background: "var(--color-bg)", borderRadius: 10,
          border: "1px solid var(--color-border)", marginBottom: 16, overflow: "hidden",
        }}>
          <div style={{
            padding: "10px 14px", borderBottom: "1px solid var(--color-border)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-text)" }}>
              Vista previa
            </span>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {rows.length} fila{rows.length !== 1 ? "s" : ""} válida{rows.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--color-surface)" }}>
                  {columns.map(c => (
                    <th key={c} style={{
                      padding: "8px 12px", textAlign: "left", fontWeight: 700,
                      color: "var(--color-text-muted)", textTransform: "uppercase",
                      fontSize: 11, letterSpacing: "0.05em",
                      borderBottom: "1px solid var(--color-border)",
                    }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {columns.map(c => (
                      <td key={c} style={{ padding: "8px 12px", color: "var(--color-text)" }}>
                        {row[c.toLowerCase()] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && (
              <p style={{ padding: "8px 12px", fontSize: 11.5, color: "var(--color-text-muted)", margin: 0 }}>
                ...y {rows.length - 10} fila{rows.length - 10 !== 1 ? "s" : ""} más
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Resultado ── */}
      {result && (
        <div style={{
          background: result.failed === 0 ? "var(--color-success-light)" : "var(--color-warning-light)",
          border: `1px solid ${result.failed === 0 ? "var(--color-success)" : "var(--color-warning)"}`,
          borderRadius: 10, padding: "12px 14px", marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: result.messages?.length ? 8 : 0 }}>
            <CheckCircle2 style={{ width: 15, height: 15, color: result.failed === 0 ? "var(--color-success)" : "var(--color-warning)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
              {result.ok} creado{result.ok !== 1 ? "s" : ""} correctamente
              {result.failed > 0 && ` · ${result.failed} con error`}
            </span>
          </div>
          {result.messages?.map((m, i) => (
            <p key={i} style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0 23px" }}>{m}</p>
          ))}
        </div>
      )}

      {/* ── Acciones ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="ghost" type="button" onClick={handleClose}>
          {result ? "Cerrar" : "Cancelar"}
        </Button>
        {canUpload && (
          <Button variant="primary" type="button" disabled={uploading} onClick={handleUpload}>
            <Upload style={{ width: 13, height: 13 }} />
            {uploading ? "Procesando..." : `Crear ${rows.length} módulo${rows.length !== 1 ? "s" : ""}`}
          </Button>
        )}
      </div>

    </Modal>
  );
}