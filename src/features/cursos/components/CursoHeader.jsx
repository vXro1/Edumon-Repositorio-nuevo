// src/features/cursos/pages/CursoHeader.refactor.jsx
import React from 'react';
import { UserAvatar } from '@/components';
import { useNavigate } from 'react-router-dom';

export default function CursoHeader({ curso, onEdit }) {
  const navigate = useNavigate();
  const cover = curso?.imagen || curso?.fotoPortada || '';
  return (
    <div style={{ borderRadius: 18, overflow: 'hidden', position: 'relative', marginBottom: 12 }}>
      <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
        {cover ? <img src={cover} alt={curso?.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.onerror=null; e.target.style.display='none'; }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--color-border)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.7))' }} />
        <div style={{ position: 'absolute', bottom: 8, left: 16, right: 16 }}>
          <h1 style={{ color: 'white', fontSize: 22, margin: 0 }}>{curso.nombre}</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            {curso.docente && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/perfil')}>
                <UserAvatar user={curso.docente} size={40} />
                <div style={{ color: 'white' }}>
                  <div style={{ fontWeight: 700 }}>{curso.docente.nombre} {curso.docente.apellido}</div>
                  <div style={{ fontSize: 12 }}>{curso.docente.rol}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
