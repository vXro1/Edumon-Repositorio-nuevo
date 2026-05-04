import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components";
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
    variant: "primary",
  },
  secondary: {
    variant: "secondary",
  },
  ghost: {
    variant: "ghost",
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
  const menuRef = useRef(null);
  const menuId = useRef(`edu-menu-${Math.random().toString(36).slice(2)}`).current;

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
    if (e.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
    }
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
        if (opt) {
          onSelect?.(opt);
          setOpen(false);
          triggerRef.current?.focus();
        }
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }, [activeIndex, enabledOptions, onSelect]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const items = menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])');
    items?.[activeIndex]?.focus();
  }, [open, activeIndex]);

  const v = VARIANTS[variant] ?? VARIANTS.primary;

  return (
    <div className="relative inline-block">

      {/* TRIGGER */}
      <Button
        ref={triggerRef}
        type="button"
        variant={v.variant}
        size="md"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleTriggerKey}
        className="flex items-center gap-2"
      >
        {avatarText && (
          <span className="flex items-center justify-center">
            {avatarText}
          </span>
        )}

        {triggerIcon && !avatarText && triggerIcon}

        <span>{label}</span>

        <IconChevron open={open} />
      </Button>

      {/* MENU */}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          onKeyDown={handleMenuKey}
          className={`absolute mt-2 min-w-[200px] z-50 ${align === "right" ? "right-0" : "left-0"}`}
        >
          {/* HEADER */}
          <div className="flex items-center gap-2 mb-1">
            <img src={logo} alt="" aria-hidden="true" className="w-4 h-4" />
            <span>
              edu<span>mon</span>
            </span>
          </div>

          {/* OPTIONS */}
          {options.map((opt) => (
            <Button
              key={opt.id}
              role="menuitem"
              size="sm"
              variant={opt.danger ? "danger" : "ghost"}
              disabled={opt.disabled}
              onClick={() => {
                if (!opt.disabled) {
                  onSelect?.(opt);
                  setOpen(false);
                  triggerRef.current?.focus();
                }
              }}
              className="w-full flex items-center gap-2"
              aria-label={opt.label}
            >
              {opt.icon && <span>{opt.icon}</span>}
              <span className="flex-1">{opt.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}