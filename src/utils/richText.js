// src/utils/richText.js
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "ul", "ol", "li", "p", "br"];

/**
 * Sanitiza HTML generado por el RichTextEditor (contentEditable) antes de
 * guardarlo o renderizarlo con dangerouslySetInnerHTML — solo permite las
 * etiquetas de formato básico que el editor puede producir.
 */
export function sanitizeRichText(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  });
}

/**
 * Versión en texto plano (sin etiquetas) — para previews truncados donde
 * renderizar HTML crudo con ellipsis podría cortar una etiqueta a la mitad.
 */
export function stripHtml(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = sanitizeRichText(html);
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

/** true si el HTML sanitizado no contiene texto visible. */
export function isRichTextEmpty(html) {
  return stripHtml(html).length === 0;
}
