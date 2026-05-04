// src/features/cursos/pages/CursoOverviewTab.refactor.jsx
import React from 'react';
export default function CursoOverviewTab({ curso }) {
  return (
    <section style={{ background: 'var(--color-surface)', padding: 18, borderRadius: 12, border: '1px solid var(--color-border)' }}>
      <h2 style={{ marginTop: 0 }}>Sobre el curso</h2>
      <p style={{ margin: 0 }}>{curso.descripcion || 'Sin descripción'}</p>
    </section>
  );
}
