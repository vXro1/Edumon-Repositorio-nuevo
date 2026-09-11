import { useEffect, useId, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
import { isRichTextEmpty } from "@/utils/richText";

const TOOLBAR_BTNS = [
  { cmd: "bold", icon: Bold, label: "Negrita" },
  { cmd: "italic", icon: Italic, label: "Cursiva" },
  { cmd: "underline", icon: Underline, label: "Subrayado" },
  { cmd: "insertUnorderedList", icon: List, label: "Lista con viñetas" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Lista numerada" },
];

/* ══════════════════════════════════════════════════════════════
   EDITOR DE TEXTO ENRIQUECIDO
   contentEditable + document.execCommand — sin dependencias externas,
   ya que solo se necesita negrita/cursiva/subrayado/listas.

   El HTML que produce SIEMPRE debe pasar por sanitizeRichText() antes
   de guardarse o renderizarse en otro lado (ver src/utils/richText.js).

   Nota sobre sincronización: el DOM del contentEditable solo se
   reescribe cuando `value` cambia desde AFUERA (ej. al cargar datos
   existentes). Si lo reescribiéramos en cada onInput perderíamos la
   posición del cursor apenas el usuario tecleara.
   ══════════════════════════════════════════════════════════════ */
export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Escribe aquí…",
  label,
  hint,
  error,
  minHeight = 120,
  maxHeight,
  compact = false,
  onKeyDown,
  id,
}) {
  const ref = useRef(null);
  const autoId = useId();
  const editorId = id ?? autoId;
  const empty = isRichTextEmpty(value);

  // Sin esto, Chrome/Firefox envuelven cada línea en un <div> al presionar
  // Enter (en vez de <p>) — como sanitizeRichText() no permite <div>,
  // DOMPurify lo quitaría y fusionaría todas las líneas en una sola.
  useEffect(() => {
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* no-op */ }
  }, []);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd) => {
    ref.current?.focus();
    document.execCommand(cmd, false, null);
    onChange?.(ref.current?.innerHTML ?? "");
  };

  return (
    <div className="field">
      {label && (
        <label htmlFor={editorId} className="field-label">
          {label}
        </label>
      )}

      <div className={`rte${error ? " rte-error" : ""}${compact ? " rte-compact" : ""}`}>
        <div className="rte-toolbar" role="toolbar" aria-label="Formato de texto">
          {TOOLBAR_BTNS.map((b) => (
            <button
              key={b.cmd}
              type="button"
              className="rte-btn"
              title={b.label}
              aria-label={b.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec(b.cmd)}
            >
              <b.icon size={15} strokeWidth={2.25} />
            </button>
          ))}
        </div>

        <div className="rte-editable-wrap">
          {empty && placeholder && <span className="rte-placeholder">{placeholder}</span>}
          <div
            ref={ref}
            id={editorId}
            className="rte-editable"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-invalid={!!error}
            style={{ minHeight, maxHeight }}
            onInput={() => onChange?.(ref.current?.innerHTML ?? "")}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>

      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
