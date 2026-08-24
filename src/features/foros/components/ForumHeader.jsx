// src/features/foros/components/ForumHeader.jsx
// Encabezado del foro — tarjeta normal dentro del flujo de la página, con el
// mismo lenguaje visual (borde, radio, sombra) que .fm-sidebar/.fm-main/
// .fm-activity, en vez de una barra fija tipo app (ver ForumPage.jsx: antes
// era `position: sticky` con su propio fondo/borde/sombra, una segunda barra
// flotando debajo de la navbar real — lo que hacía sentir el foro como una
// pieza de software aparte pegada al dashboard, no parte del mismo diseño).
import { ArrowLeft, MessageSquare, Lock, Unlock, PanelLeft, PanelRight } from 'lucide-react';

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
      <div className="fm-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-surface-2)',
            animation: 'fm-pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
            <div style={{ width: 200, height: 16, borderRadius: 4, background: 'var(--color-surface-2)',
              animation: 'fm-pulse 1.4s ease-in-out infinite' }} />
            <div style={{ width: 120, height: 12, borderRadius: 4, background: 'var(--color-surface-2)',
              animation: 'fm-pulse 1.4s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  const isClosed = foro?.estado === 'cerrado' || foro?.cerrado;

  return (
    <div>
      {/* Volver — mismo botón de texto simple que usa el resto de la app
          (ver CursoHubPage.jsx), en vez de estar embebido dentro de la barra. */}
      <button type="button" onClick={onBack} className="fm-back">
        <ArrowLeft size={15} />
        Volver a foros
      </button>

      <div className="fm-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0, flex: 1 }}>
          {/* Ícono — mismo lenguaje de "badge cuadrado con color de sección"
              que usa el resto del dashboard (ver .section-foros, rosa). */}
          <div className="fm-header-icon" data-closed={isClosed || undefined}>
            {isClosed ? <Lock size={20} /> : <MessageSquare size={20} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {cursoNombre && (
              <p className="fm-eyebrow">{cursoNombre} · Foros</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <h1 className="fm-title">{foro?.titulo ?? 'Foro'}</h1>
              <span className="fm-status" data-closed={isClosed || undefined}>
                {isClosed ? 'Cerrado' : 'Abierto'}
              </span>
            </div>
            {foro?.descripcion && (
              <p className="fm-desc">{foro.descripcion}</p>
            )}
            {foro?.totalMensajes > 0 && (
              <p className="fm-count">
                <MessageSquare size={12} />
                {foro.totalMensajes} mensaje{foro.totalMensajes !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Acciones — se envuelven en su propia fila en pantallas angostas
            en vez de comprimirse hasta ser irreconocibles. */}
        <div className="fm-header-actions">
          {canManage && (
            <button type="button" onClick={onToggleEstado} disabled={togglingEstado}
              className="fm-action" data-variant={isClosed ? 'open' : 'close'}>
              {isClosed ? <Unlock size={14} /> : <Lock size={14} />}
              {isClosed ? 'Abrir foro' : 'Cerrar foro'}
            </button>
          )}

          <button type="button" onClick={onToggleActivity} className="fm-action" data-active={activityOpen || undefined}
            title={activityOpen ? 'Ocultar estadísticas y participantes' : 'Mostrar estadísticas y participantes'}>
            <PanelRight size={15} />
            <span className="fm-action-label">Actividad</span>
          </button>

          <button type="button" onClick={onToggleSidebar} className="fm-action" data-active={sidebarOpen || undefined}
            title={sidebarOpen ? 'Ocultar lista de foros' : 'Mostrar lista de foros'}>
            <PanelLeft size={15} />
            <span className="fm-action-label">Foros</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForumHeader;
