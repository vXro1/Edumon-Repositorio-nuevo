import { useEffect, useLayoutEffect, useRef, useId, useCallback } from "react";
import { Button } from "@/components";
import { X } from "lucide-react";

const MAX_WIDTHS = { sm: 420, md: 560, lg: 720, xl: 900 };

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnOverlay = true,
}) {
  const panelRef = useRef(null);
  const overlayRef = useRef(null);
  const mouseDownTarget = useRef(null);
  const titleId = useId();
  const maxWidth = MAX_WIDTHS[size] ?? MAX_WIDTHS.md;

  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!isOpen) return;

    const prevFocus = document.activeElement;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") { onCloseRef.current(); return; }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
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
  }, [isOpen]);

  const handleOverlayMouseDown = useCallback((e) => {
    mouseDownTarget.current = e.target;
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (closeOnOverlay && mouseDownTarget.current === overlayRef.current) {
      onClose();
    }
    mouseDownTarget.current = null;
  }, [closeOnOverlay, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden={!isOpen}
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
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
        <div
          aria-hidden="true"
          style={{
            height: 3,
            flexShrink: 0,
            background: "var(--gradient-brand)",
          }}
        />

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

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              <X />
            </Button>
          </div>
        )}

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