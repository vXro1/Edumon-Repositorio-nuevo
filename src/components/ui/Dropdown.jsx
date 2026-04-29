// src/components/ui/Dropdown.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import logo from "@/assets/icons/logo.svg";

function IconChevron({ open }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const VARIANTS = {
  primary: {
    trigger: "text-white",
    style: {
      background: "var(--color-primary)",
      boxShadow: "var(--shadow-primary)",
    },
  },
  secondary: {
    trigger: "text-white",
    style: {
      background: "var(--color-secondary)",
      boxShadow: "var(--shadow-secondary)",
    },
  },
  ghost: {
    trigger: "text-[color:var(--color-text)]",
    style: {
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      boxShadow: "var(--shadow-xs)",
    },
  },
};

export default function EdumonDropdown({
  label = "Opciones",
  options = [],
  onSelect,
  triggerIcon,
  avatarText,
  variant = "primary",
  align = "left",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef(null);
  const menuRef    = useRef(null);
  const menuId     = useRef(`edu-menu-${Math.random().toString(36).slice(2)}`).current;

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Reset active index when menu closes */
  useEffect(() => {
    if (!open) setActiveIndex(-1);
  }, [open]);

  const enabledOptions = options.filter((o) => !o.disabled);

  const handleTriggerKey = useCallback((e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(0);
    }
    if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
  }, [disabled]);

  const handleMenuKey = useCallback((e) => {
    const count = enabledOptions.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % count);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + count) % count);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(count - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeIndex >= 0) {
        const opt = enabledOptions[activeIndex];
        if (opt) { onSelect?.(opt); setOpen(false); triggerRef.current?.focus(); }
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }, [activeIndex, enabledOptions, onSelect]);

  /* Focus active item */
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const items = menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])');
    items?.[activeIndex]?.focus();
  }, [open, activeIndex]);

  const v = VARIANTS[variant] ?? VARIANTS.primary;

  return (
    <div className="relative inline-block">

      {/* TRIGGER */}
      <button
        ref={triggerRef}
        type="button"
        id={`${menuId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleTriggerKey}
        className={[
          "relative group flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm",
          "transition-all duration-200 select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2",
          "active:scale-[0.97]",
          disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:brightness-105",
          v.trigger,
        ].join(" ")}
        style={v.style}
      >
        {avatarText && (
          <span
            className="w-6 h-6 rounded-full bg-white/30 text-xs font-bold flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {avatarText}
          </span>
        )}

        {triggerIcon && !avatarText && triggerIcon}

        <span>{label}</span>

        <IconChevron open={open} />
      </button>

      {/* MENU */}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          onKeyDown={handleMenuKey}
          className={[
            "absolute mt-2 min-w-[200px] rounded-xl p-1.5 z-50",
            "border edu-slide-down",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* MENU HEADER */}
          <div
            className="flex items-center gap-2 px-2.5 py-2 mb-1"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <img src={logo} alt="" aria-hidden="true" className="w-4 h-4" />
            <span className="text-xs font-bold" style={{ color: "var(--color-text)" }}>
              edu<span style={{ color: "var(--color-primary)" }}>mon</span>
            </span>
          </div>

          {/* OPTIONS */}
          {options.map((opt, idx) => {
            const enabledIdx = enabledOptions.indexOf(opt);
            const isFocused  = !opt.disabled && enabledIdx === activeIndex;

            return (
              <button
                key={opt.id}
                role="menuitem"
                tabIndex={-1}
                disabled={opt.disabled}
                onClick={() => {
                  if (!opt.disabled) {
                    onSelect?.(opt);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }
                }}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left",
                  "transition-colors duration-150 focus:outline-none",
                  opt.disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer",
                ].join(" ")}
                style={{
                  color: opt.danger ? "var(--color-error)" : "var(--color-text)",
                  background: isFocused
                    ? opt.danger
                      ? "var(--color-error-light)"
                      : "var(--color-primary-light)"
                    : "transparent",
                }}
                onMouseEnter={() => !opt.disabled && setActiveIndex(enabledIdx)}
              >
                {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
                <span className="flex-1">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
