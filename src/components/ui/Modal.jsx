// src/components/ui/Modal.jsx
import { useEffect, useLayoutEffect, useRef, useId } from "react";
import { X } from "lucide-react";

/*
 * Tamaños disponibles → maxWidth del panel
 * Úsalos vía prop size="sm|md|lg|xl"
 */
const MAX_WIDTHS = { sm: 420, md: 560, lg: 720, xl: 900 };

/* ── Modal ──────────────────────────────────────────────────────
 *
 * Props:
 *   isOpen          boolean         — controla visibilidad
 *   onClose         () => void      — callback al cerrar
 *   title           string          — título en el header (opcional)
 *   description     string          — subtítulo bajo el título (opcional)
 *   size            "sm"|"md"|"lg"|"xl"  — ancho máximo (default "md")
 *   closeOnOverlay  boolean         — cerrar al clickar fuera (default true)
 *   children        ReactNode       — contenido del body
 *
 * Comportamiento:
 *   • Escape cierra el modal
 *   • Click en overlay cierra (si closeOnOverlay=true)
 *   • stopPropagation en el panel → los inputs no sufren interferencias
 *   • Focus trap: Tab/Shift+Tab ciclan entre elementos focusables del panel
 *   • Al abrir: auto-focus al primer input/textarea/select del panel
 *   • Al cerrar: foco vuelve al elemento que lo tenía antes
 *   • body.overflow = hidden mientras está abierto
 * ─────────────────────────────────────────────────────────────── */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnOverlay = true,
}) {
  const panelRef    = useRef(null);
  const titleId     = useId();
  const maxWidth    = MAX_WIDTHS[size] ?? MAX_WIDTHS.md;

  /*
   * onCloseRef — mantiene la referencia más reciente de onClose sin que el
   * efecto principal tenga que incluirla como dependencia. Esto es crítico:
   * si onClose fuera dependencia, el efecto se re-ejecutaría en cada render
   * del padre (cada tecla), causando parpadeo y saltos de foco.
   */
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => { onCloseRef.current = onClose; });

  /* ── Efecto principal — solo corre cuando isOpen cambia ── */
  useEffect(() => {
    if (!isOpen) return;

    const prevFocus = document.activeElement;
    document.body.style.overflow = "hidden";

    // Keyboard: Escape + focus trap
    const onKey = (e) => {
      if (e.key === "Escape") { onCloseRef.current(); return; }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (!focusable.length) return;

        const first  = focusable[0];
        const last   = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus();
    };
  }, [isOpen]); // ← SOLO isOpen. onClose va por ref para no re-ejecutar el efecto.

  if (!isOpen) return null;

  return (
    /* ── Overlay ─────────────────────────────────────────────── */
    <div
      aria-hidden={!isOpen}
      onClick={() => closeOnOverlay && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "edu-backdrop-in 0.2s ease both",
      }}
    >
      {/* ── Panel ─────────────────────────────────────────────
       *  stopPropagation aquí es la clave:
       *  los clicks dentro del panel nunca llegan al overlay,
       *  por lo que los inputs no sufren ninguna interferencia.
       * ───────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: maxWidth,
          maxHeight: "calc(100dvh - 32px)",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-surface)",
          borderRadius: 20,
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.18), 0 32px 64px rgba(0,0,0,0.12)",
          overflow: "hidden",
          animation: "edu-modal-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Accent line — identidad de marca sin pesar visualmente */}
        <div
          aria-hidden="true"
          style={{
            height: 3,
            flexShrink: 0,
            background: "var(--gradient-brand)",
          }}
        />

        {/* ── Header ── */}
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              padding: "20px 24px 16px",
              borderBottom: "1px solid var(--color-border)",
              flexShrink: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h2
                id={titleId}
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--color-text)",
                  margin: 0,
                  lineHeight: 1.35,
                }}
              >
                {title}
              </h2>
              {description && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-muted)",
                    margin: "5px 0 0",
                    lineHeight: 1.5,
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "transparent",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
                marginTop: -2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background    = "var(--color-bg)";
                e.currentTarget.style.color         = "var(--color-text)";
                e.currentTarget.style.borderColor   = "rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background    = "transparent";
                e.currentTarget.style.color         = "var(--color-text-muted)";
                e.currentTarget.style.borderColor   = "var(--color-border)";
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}

        {/* ── Body ──────────────────────────────────────────────
         *  overflowY: auto → soporta formularios largos sin romper el layout
         * ───────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px 24px",
            minHeight: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
