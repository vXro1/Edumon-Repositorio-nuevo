// src/features/foros/components/ForumHeader.jsx
// Encabezado fijo del foro: navegación hacia atrás, migas de pan, título, estado y controles de gestión.
// En móvil: migas de pan, descripción y alternador de actividad se ocultan con clases CSS.
import { ArrowLeft, MessageSquare, Lock, Unlock, ChevronRight,
         PanelLeft, PanelRight } from 'lucide-react';

const ForumHeader = ({
  foro,
  cursoNombre,
  cursoId,
  loading        = false,
  onBack,
  canManage      = false,
  onToggleEstado,
  togglingEstado = false,
  sidebarOpen,
  onToggleSidebar,
  activityOpen,
  onToggleActivity,
}) => {
  if (loading) {
    return (
      <header style={HEADER_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-surface-2)',
            animation: 'fm-pulse 1.4s ease-in-out infinite' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ width: 160, height: 14, borderRadius: 4, background: 'var(--color-surface-2)',
              animation: 'fm-pulse 1.4s ease-in-out infinite' }} />
            <div style={{ width: 100, height: 11, borderRadius: 4, background: 'var(--color-surface-2)',
              animation: 'fm-pulse 1.4s ease-in-out infinite' }} />
          </div>
        </div>
      </header>
    );
  }

  const isClosed = foro?.estado === 'cerrado' || foro?.cerrado;

  return (
    <header style={HEADER_STYLE}>
      {/* ── Izquierda: volver + migas de pan + estado + título ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>

        {/* Botón volver — siempre visible */}
        <button type="button" onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 6px', borderRadius: 6,
            color: 'var(--color-text-muted)', display: 'flex',
            alignItems: 'center', gap: 4, fontSize: 13,
            transition: 'color 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          <ArrowLeft size={14} />
        </button>

        {/* Migas de pan — ocultas en móvil vía CSS */}
        {cursoNombre && (
          <div className="fm-breadcrumb"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5,
              color: 'var(--color-text-muted)', flexShrink: 0 }}>
            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cursoNombre}
            </span>
            <ChevronRight size={12} />
            <span>Foros</span>
            <ChevronRight size={12} />
          </div>
        )}

        {/* Ícono de estado — siempre visible */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isClosed ? 'rgba(220,38,38,0.08)' : 'rgba(5,150,105,0.08)',
          color: isClosed ? 'var(--color-error-hover)' : '#059669',
        }}>
          {isClosed ? <Lock size={14} /> : <MessageSquare size={14} />}
        </div>

        {/* Título + insignia de estado + descripción */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'nowrap' }}>
            <h1 style={{
              margin: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
              fontWeight: 800, color: 'var(--color-text)',
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {foro?.titulo ?? 'Foro'}
            </h1>

            {/* Estado badge */}
            <span style={{
              flexShrink: 0, fontSize: 10, fontWeight: 700,
              padding: '2px 7px', borderRadius: 9999,
              background: isClosed ? '#fee2e2' : '#d1fae5',
              color: isClosed ? 'var(--color-error-hover)' : '#059669',
            }}>
              {isClosed ? 'Cerrado' : 'Abierto'}
            </span>
          </div>

          {/* Descripción — oculta en móvil */}
          {foro?.descripcion && (
            <p className="fm-breadcrumb"
              style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--color-text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {foro.descripcion}
            </p>
          )}
        </div>

        {/* Conteo de mensajes — oculto en móvil */}
        {foro?.totalMensajes > 0 && (
          <div className="fm-breadcrumb"
            style={{
              flexShrink: 0, fontSize: 12, color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              background: 'var(--color-surface-2)', borderRadius: 8,
            }}>
            <MessageSquare size={13} />
            {foro.totalMensajes}
          </div>
        )}
      </div>

      {/* ── Derecha: acciones de gestión + alternadores de panel ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Alternar estado — ícono + texto (el texto se oculta en XS) */}
        {canManage && (
          <button type="button" onClick={onToggleEstado} disabled={togglingEstado}
            style={{
              display:    'flex', alignItems: 'center', gap: 5,
              background: isClosed ? '#d1fae5' : '#fee2e2',
              color:      isClosed ? '#059669' : 'var(--color-error-hover)',
              border:     'none', borderRadius: 8,
              padding:    '6px 10px', cursor: 'pointer',
              fontSize:   12.5, fontWeight: 700,
              transition: 'opacity 0.15s',
              opacity:    togglingEstado ? 0.6 : 1,
              flexShrink: 0,
            }}>
            {isClosed ? <Unlock size={13} /> : <Lock size={13} />}
            <span className="fm-action-label">{isClosed ? 'Abrir' : 'Cerrar'}</span>
          </button>
        )}

        {/* Alternar panel de actividad — oculto en móvil */}
        <button type="button"
          className="fm-toggle-activity"
          onClick={onToggleActivity}
          title={activityOpen ? 'Ocultar panel de actividad' : 'Mostrar panel de actividad'}
          style={iconBtn(activityOpen)}>
          <PanelRight size={16} />
        </button>

        {/* Alternador del sidebar — siempre visible, actúa como hamburguesa en móvil */}
        <button type="button"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Ocultar lista de foros' : 'Mostrar lista de foros'}
          style={iconBtn(sidebarOpen)}>
          <PanelLeft size={16} />
        </button>
      </div>
    </header>
  );
};

const HEADER_STYLE = {
  position:       'sticky',
  top:            0,
  zIndex:         20,
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  gap:            8,
  padding:        '10px 14px',
  background:     'var(--color-surface, #fff)',
  borderBottom:   '1px solid var(--color-border)',
  boxShadow:      '0 1px 6px rgba(0,0,0,0.05)',
  minHeight:      54,
};

const iconBtn = (active) => ({
  background:   active ? 'rgba(12,106,196,0.08)' : 'none',
  border:       'none',
  borderRadius: 8,
  padding:      '6px',
  cursor:       'pointer',
  color:        active ? 'var(--color-primary)' : 'var(--color-text-muted)',
  display:      'flex',
  alignItems:   'center',
  transition:   'background 0.15s, color 0.15s',
});

export default ForumHeader;
