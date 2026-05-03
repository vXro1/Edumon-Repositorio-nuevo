// src/features/cursos/pages/CursoTareasTab.refactor.jsx
import React from 'react';

export default function CursoTareasTab({ curso, data = [] }) {
  return (
    <div>
      {data.length === 0 ? (
        <div style={{ padding: 24, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>No hay tareas</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {data.map(t => (
            <li key={t._id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.titulo}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t.descripcion}</div>
                </div>
                <div style={{ fontSize: 12 }}>{t.fechaEntrega ? new Date(t.fechaEntrega).toLocaleDateString() : 'Sin entrega'}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
