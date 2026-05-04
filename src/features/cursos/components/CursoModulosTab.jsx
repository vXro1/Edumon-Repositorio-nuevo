// src/features/cursos/pages/CursoModulosTab.refactor.jsx
import React from 'react';
export default function CursoModulosTab({ curso, data = [], reload }) {
  return (
    <div>
      {data.length === 0 ? (
        <div style={{ padding: 24, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>No hay módulos</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {data.map(m => (
            <li key={m._id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.titulo}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{m.descripcion}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
