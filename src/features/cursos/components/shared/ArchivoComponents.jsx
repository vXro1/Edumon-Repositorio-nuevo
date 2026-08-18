import { useEffect, useState } from "react";
import { FileText, Film, File, Download, ExternalLink } from "lucide-react";

/* ─────────────────────────────────────────────
   DETECTOR MEJORADO DE TIPOS
───────────────────────────────────────────── */
function detectTipo(tipo = "", url = "") {
  const t = tipo.toLowerCase();

  if (t.includes("image") || t === "imagen") return "imagen";
  if (t.includes("video")) return "video";
  if (t.includes("pdf")) return "pdf";
  if (t.includes("audio")) return "audio";
  if (t.includes("zip") || t.includes("rar")) return "comprimido";
  if (t.includes("word") || t.includes("doc")) return "doc";
  if (t.includes("excel") || t.includes("sheet")) return "excel";

  // alternativa por extensión
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)/i.test(url)) return "imagen";
  if (/\.(mp4|mov|avi|webm|mkv)/i.test(url)) return "video";
  if (/\.pdf/i.test(url)) return "pdf";
  if (/\.(doc|docx)/i.test(url)) return "doc";
  if (/\.(xls|xlsx)/i.test(url)) return "excel";

  return "archivo";
}

/* ───────────────────────────────────────────── */
function fmtTamano(bytes = 0) {
  if (!bytes) return null;

  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─────────────────────────────────────────────
   VISTA PREVIA LOCAL (ANTES DE SUBIR)
───────────────────────────────────────────── */
export function ArchivoPreview({ archivo, onRemove }) {
  const [preview, setPreview] = useState(null);

  const esImagen = archivo.type?.startsWith("image/");
  const esVideo = archivo.type?.startsWith("video/");
  const tamStr = fmtTamano(archivo.size);

  useEffect(() => {
    if (!esImagen && !esVideo) return;

    const url = URL.createObjectURL(archivo);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  return (
    <div style={{
      position: "relative",
      width: 80,
      height: 80,
      borderRadius: 10,
      overflow: "hidden",
      border: "1.5px solid var(--color-border)",
      background: "var(--color-surface)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>

      {/* eliminar */}
      <button
        onClick={onRemove}
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: 18,
          height: 18,
          cursor: "pointer",
          fontSize: 10,
        }}
      >
        ✕
      </button>

      {esImagen && preview ? (
        <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : esVideo ? (
        <Film size={24} color="var(--color-primary)" />
      ) : (
        <File size={24} color="var(--color-text-muted)" />
      )}

      {tamStr && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          fontSize: 8,
          textAlign: "center",
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
        }}>
          {tamStr}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ARCHIVO YA SUBIDO (CLOUDINARY / BACKEND)
───────────────────────────────────────────── */
export function ArchivoRecibido({ a, mine }) {
  if (!a?.url) return null;

  const url = a.url;
  const nombre = a.nombre ?? a.name ?? "Archivo";
  const tamStr = fmtTamano(a.tamano ?? a.size ?? 0);
  const tipo = detectTipo(a.tipo ?? a.type ?? "", url);

  /* IMAGEN */
  if (tipo === "imagen") {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt={nombre}
          style={{
            maxWidth: 260,
            borderRadius: 10,
            border: mine ? "2px solid rgba(255,255,255,0.2)" : "1px solid var(--color-border)",
          }}
        />
      </a>
    );
  }

  /* VIDEO */
  if (tipo === "video") {
    return (
      <video controls style={{ maxWidth: 280, borderRadius: 10 }}>
        <source src={url} />
      </video>
    );
  }

  /* PDF */
  if (tipo === "pdf") {
    return (
      <a href={url} target="_blank" rel="noreferrer"
        style={{
          display: "flex",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid var(--color-border)",
          textDecoration: "none",
          color: "var(--color-primary)",
        }}>
        <FileText size={18} />
        <div style={{ flex: 1 }}>
          <strong>{nombre}</strong>
          <div style={{ fontSize: 11 }}>{tamStr}</div>
        </div>
        <ExternalLink size={14} />
      </a>
    );
  }

  /* DEFAULT */
  return (
    <a href={url} target="_blank" rel="noreferrer"
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid var(--color-border)",
        textDecoration: "none",
      }}>
      <Download size={18} />
      <div style={{ flex: 1 }}>
        <strong>{nombre}</strong>
        <div style={{ fontSize: 11 }}>{tamStr}</div>
      </div>
    </a>
  );
}