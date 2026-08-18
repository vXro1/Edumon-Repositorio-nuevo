// src/components/ui/FileUpload.jsx
// Reusable file upload component — drag-and-drop zone + compact attachment button mode
import { useState, useRef, useCallback, useEffect } from "react";
import { Paperclip, X, FileText, Film, File } from "lucide-react";
import { Button } from "@/components";

// ── Thumbnail for a single pending file ───────────────────────────────────────
function FileThumb({ file, onRemove }) {
  const [preview, setPreview] = useState(null);
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isPdf   = file.type === "application/pdf";
  const sizeStr = file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(0)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  useEffect(() => {
    if (!isImage && !isVideo) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage, isVideo]);

  return (
    <div style={{
      position: "relative",
      width: 72, height: 72, flexShrink: 0,
      borderRadius: 10,
      border: "1.5px solid var(--color-border)",
      background: "var(--color-bg)",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* ── Remove button ── */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Quitar archivo"
        onClick={onRemove}
        style={{
          position: "absolute", top: 3, right: 3, zIndex: 2,
          width: 18, height: 18, borderRadius: "50%",
          background: "rgba(0,0,0,0.65)", color: "white",
          padding: 0, minWidth: "unset",
        }}
      >
        <X style={{ width: 9, height: 9 }} />
      </Button>

      {isImage && preview ? (
        <img src={preview} alt={file.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : isVideo ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: 6 }}>
          <Film style={{ width: 24, height: 24, color: "var(--color-primary)" }} />
          <span style={{ fontSize: 8, color: "var(--color-text-muted)", textAlign: "center",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 60 }}>
            {file.name}
          </span>
        </div>
      ) : isPdf ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: 6 }}>
          <FileText style={{ width: 24, height: 24, color: "var(--color-error-hover)" }} />
          <span style={{ fontSize: 8, color: "var(--color-text-muted)", textAlign: "center",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 60 }}>
            {file.name}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: 6 }}>
          <File style={{ width: 24, height: 24, color: "var(--color-text-muted)" }} />
          <span style={{ fontSize: 8, color: "var(--color-text-muted)", textAlign: "center",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 60 }}>
            {file.name}
          </span>
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "rgba(0,0,0,0.52)", color: "white",
        fontSize: 7, textAlign: "center", padding: "2px 0",
        letterSpacing: "0.03em",
      }}>
        {sizeStr}
      </div>
    </div>
  );
}

// ── Main FileUpload component ─────────────────────────────────────────────────
export default function FileUpload({
  files = [],
  onChange,
  accept = "image/*,video/mp4,.pdf",
  maxFiles = 5,
  label = "Arrastra archivos aquí o haz clic para adjuntar",
  compact = false,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming) => {
    const next = [...files, ...Array.from(incoming)].slice(0, maxFiles);
    onChange(next);
  }, [files, maxFiles, onChange]);

  const removeFile = (i) => onChange(files.filter((_, idx) => idx !== i));

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const canAdd = files.length < maxFiles;

  const hiddenInput = (
    <input ref={inputRef} type="file" multiple hidden accept={accept}
      onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
  );

  // ── Compact: attach-button + thumbnail strip ───────────────────────────────
  if (compact) {
    return (
      <div>
        {hiddenInput}
        {files.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 0" }}>
            {files.map((f, i) => <FileThumb key={i} file={f} onRemove={() => removeFile(i)} />)}
          </div>
        )}
        {canAdd && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Adjuntar archivos"
            title="Adjuntar archivos"
            onClick={() => inputRef.current?.click()}
            className="shrink-0"
          >
            <Paperclip style={{ width: 16, height: 16 }} />
          </Button>
        )}
      </div>
    );
  }

  // ── Full: drag-and-drop zone + thumbnails ─────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {hiddenInput}

      {files.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {files.map((f, i) => <FileThumb key={i} file={f} onRemove={() => removeFile(i)} />)}
        </div>
      )}

      {/* Drop zone — DIV intencional, no es un button */}
      {canAdd && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${dragging ? "var(--color-primary)" : "var(--color-border)"}`,
            borderRadius: 10,
            padding: "16px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging
              ? "rgba(12,106,196,0.05)"
              : "var(--color-bg)",
            transition: "border-color 0.15s, background 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            color: dragging ? "var(--color-primary)" : "var(--color-text-muted)",
            fontSize: 13,
            userSelect: "none",
          }}
        >
          <Paperclip style={{ width: 15, height: 15, flexShrink: 0 }} />
          <span>{dragging ? "Suelta los archivos aquí" : label}</span>
          <span style={{ fontSize: 11, opacity: 0.65 }}>
            {files.length > 0 ? `(${files.length}/${maxFiles})` : `(máx. ${maxFiles})`}
          </span>
        </div>
      )}
    </div>
  );
}