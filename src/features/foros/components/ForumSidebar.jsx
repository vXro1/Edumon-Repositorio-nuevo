// src/features/foros/components/ForumSidebar.jsx
// Left sidebar: list of forums within the course. Clicking navigates to ForumPage.
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Lock, Plus } from 'lucide-react';

const ForumSidebar = ({
  forums = [],
  currentId,
  cursoId,
  canCreate = false,
  onCreateClick,
  onClose,
  loading = false,
}) => {
  const navigate = useNavigate();

  return (
    <aside style={{
      background: 'var(--color-surface)',
      padding:    '16px 0',
      minHeight:  '100%',
      boxSizing:  'border-box',
    }}>
      {/* Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 14px 12px',
        borderBottom:   '1px solid var(--color-border)',
        marginBottom:   8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          Foros del curso
        </span>
        {canCreate && (
          <button type="button" onClick={onCreateClick}
            title="Nuevo foro"
            style={{
              background:   'rgba(140,56,240,0.10)',
              border:       'none',
              borderRadius: 6,
              padding:      '4px 6px',
              cursor:       'pointer',
              color:        'var(--color-primary)',
              display:      'flex',
              alignItems:   'center',
              transition:   'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(140,56,240,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(140,56,240,0.10)'}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Forum list */}
      {loading ? (
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 52, borderRadius: 8,
              background: 'var(--color-surface-2)',
              animation: 'fm-pulse 1.4s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : forums.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--color-text-muted)',
          padding: '24px 14px', lineHeight: 1.5 }}>
          No hay foros en este curso.
        </p>
      ) : (
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
          {forums.map(f => {
            const isActive  = f._id === currentId;
            const isClosed  = f.estado === 'cerrado' || f.cerrado;
            const Icon      = isClosed ? Lock : MessageSquare;
            const iconColor = isActive ? 'var(--color-primary)' : isClosed
              ? 'var(--color-text-muted)' : 'var(--color-text-muted)';

            return (
              <button
                key={f._id}
                type="button"
                onClick={() => { navigate(`/curso/${cursoId}/foro/${f._id}`); onClose?.(); }}
                style={{
                  width:          '100%',
                  display:        'flex',
                  alignItems:     'flex-start',
                  gap:            10,
                  padding:        '9px 10px',
                  borderRadius:   8,
                  border:         'none',
                  cursor:         'pointer',
                  textAlign:      'left',
                  background:     isActive ? 'rgba(140,56,240,0.08)' : 'transparent',
                  transition:     'background 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={14} style={{ flexShrink: 0, marginTop: 2, color: iconColor }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin:        0,
                    fontSize:      13,
                    fontWeight:    isActive ? 700 : 500,
                    color:         isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    overflow:      'hidden',
                    textOverflow:  'ellipsis',
                    whiteSpace:    'nowrap',
                  }}>
                    {f.titulo}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {f.totalMensajes ?? 0} mensajes
                    {isClosed && <span style={{ marginLeft: 5, color: '#dc2626' }}>· Cerrado</span>}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      )}
    </aside>
  );
};

export default ForumSidebar;
