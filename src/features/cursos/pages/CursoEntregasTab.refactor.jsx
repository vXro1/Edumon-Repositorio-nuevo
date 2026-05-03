// src/features/cursos/pages/CursoEntregasTab.refactor.jsx
import React from 'react';

export default function CursoEntregasTab({ data = [], onGrade }) {
  return (
    <div>
      {data.length === 0 ? (
        <div style={{ padding: 24, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>No hay entregas</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {data.map(e => (
            <li key={e._id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{e.usuario?.nombre || 'Desconocido'}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{e.comentario || ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onGrade && onGrade(e)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#6366F1', color: 'white' }}>Calificar</button>
                  {e.archivos && e.archivos.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)', textDecoration: 'none' }}>{a.nombre || 'Archivo'}</a>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
