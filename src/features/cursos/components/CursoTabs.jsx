// src/features/cursos/components/CursoTabs.jsx
// Pure presentational — no role/permission logic.
// Uses .tab-bar / .tab-item from Layout.css.
import React from "react";

export default function CursoTabs({ tabs = [], active, onChange }) {
  if (tabs.length === 0) return null;

  return (
    <nav className="tab-bar" role="tablist" aria-label="Secciones del curso">
      {tabs.map(tab => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          aria-controls={`tabpanel-${tab.key}`}
          onClick={() => onChange?.(tab.key)}
          className={`tab-item${active === tab.key ? " active" : ""}`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
