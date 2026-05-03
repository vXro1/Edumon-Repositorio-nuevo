// src/features/cursos/pages/CursoTabs.refactor.jsx
import React from 'react';

export default function CursoTabs({ tabs = [], active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '8px 16px' }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange && onChange(t)} style={{ background: 'none', border: 'none', padding: '10px 12px', cursor: 'pointer', fontWeight: active === t ? 700 : 500, borderBottom: active === t ? '2px solid #0C6AC4' : '2px solid transparent' }}>{t}</button>
      ))}
    </div>
  );
}
