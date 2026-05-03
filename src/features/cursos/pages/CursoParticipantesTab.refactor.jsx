// src/features/cursos/pages/CursoParticipantesTab.refactor.jsx
import React from 'react';
import UserAvatar from '@/components/ui/UserAvatar';

export default function CursoParticipantesTab({ data = [], onAdd }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={onAdd} style={{ padding: '8px 12px', borderRadius: 8, background: '#0C6AC4', color: 'white', border: 'none' }}>Agregar participante</button>
      </div>
      {data.length === 0 ? (
        <div style={{ padding: 24, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>No hay participantes</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {data.map(p => (
            <li key={p.usuario._id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
              <UserAvatar user={p.usuario} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.usuario.nombre} {p.usuario.apellido}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{p.usuario.correo || ''}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
