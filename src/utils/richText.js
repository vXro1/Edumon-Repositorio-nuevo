import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "ul", "ol", "li", "p", "br"];

// sanitiza el HTML del RichTextEditor antes de guardar o usar dangerouslySetInnerHTML
export function sanitizeRichText(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  });
}

// texto plano, para previews truncados donde un ellipsis podría cortar una etiqueta a la mitad
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
