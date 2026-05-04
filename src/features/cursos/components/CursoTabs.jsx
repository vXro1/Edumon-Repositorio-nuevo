// src/features/cursos/components/CursoTabs.jsx
// Recibe el array ya filtrado por permisos desde CursoHubPage.
// Este componente es puro: no sabe nada de roles ni permisos.
// Solo renderiza lo que le pasan.
import React from "react";
const TAB_STYLES = {
  container: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
    padding: "0 16px",
    overflowX: "auto",  // mobile: scroll horizontal si hay muchos tabs
  },
  button: (isActive) => ({
    background: "none",
    border: "none",
    borderBottom: isActive
      ? "2px solid var(--color-text-info)"
      : "2px solid transparent",
    padding: "12px 14px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: isActive ? 500 : 400,
    color: isActive
      ? "var(--color-text-primary)"
      : "var(--color-text-secondary)",
    whiteSpace: "nowrap",
    transition: "color 0.15s, border-color 0.15s",
  }),
};

export default function CursoTabs({ tabs = [], active, onChange }) {
  if (tabs.length === 0) return null;

  return (
    <nav
      aria-label="Secciones del curso"
      style={TAB_STYLES.container}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          aria-controls={`tabpanel-${tab.key}`}
          onClick={() => onChange?.(tab.key)}
          style={TAB_STYLES.button(active === tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}