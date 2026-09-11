import { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const SIZE_MAP = { sm: "modal-sm", md: "modal-md", lg: "modal-lg", xl: "modal-xl" };

/* ─── Main component ──────────────────────────────────────────────────── */
function AppModal({ isOpen, onClose, size = "md", closeOnOverlay = true, children }) {
  const panelRef        = useRef(null);
  const mouseDownTarget = useRef(null);
  const onCloseRef      = useRef(onClose);
  useLayoutEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!isOpen) return;
    const prevFocus = document.activeElement;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onCloseRef.current?.(); return; }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll(
          'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => {
      panelRef.current?.querySelector(
        'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus();
    };
  }, [isOpen]);

  const handleOverlayMouseDown = useCallback((e) => { mouseDownTarget.current = e.target; }, []);
  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlay && !panelRef.current?.contains(mouseDownTarget.current)) {
      onCloseRef.current?.();
    }
    mouseDownTarget.current = null;
  }, [closeOnOverlay]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        ref={panelRef}
        className={`modal-panel ${SIZE_MAP[size] ?? "modal-md"}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-strip" aria-hidden="true" />
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────── */
AppModal.Header = function ModalHeader({ title, description, onClose }) {
  return (
    <div className="modal-header">
      <div style={{ minWidth: 0 }}>
        <h2 className="modal-title">{title}</h2>
        {description && <p className="modal-description">{description}</p>}
      </div>
      {onClose && (
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
      )}
    </div>
  );
};

AppModal.Body = function ModalBody({ children, className }) {
  return (
    <div className={`modal-body${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
};

AppModal.Footer = function ModalFooter({ children, align = "end" }) {
  const alignClass = align === "start"   ? " modal-footer-start"
                   : align === "center"  ? " modal-footer-center"
                   : align === "between" ? " modal-footer-spread"
                   : "";
  return (
    <div className={`modal-footer${alignClass}`}>
      {children}
    </div>
  );
};

export default AppModal;
