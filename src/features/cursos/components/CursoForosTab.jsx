// src/features/cursos/pages/CursoForosTab.refactor.jsx
import React from 'react';

export default function CursoForosTab({ data = [] }) {
  return (
    <div>
      {data.length === 0 ? (
        <div style={{ padding: 24, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>No hay foros</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {data.map(f => (
            <li key={f._id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{f.titulo}</div>
              <div style={{ color: 'var(--color-text-muted)' }}>{f.descripcion}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}