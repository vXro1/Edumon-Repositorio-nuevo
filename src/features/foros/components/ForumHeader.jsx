// tarjeta normal dentro del flujo, mismo lenguaje visual que .fm-sidebar/.fm-main, nunca sticky
import { useState } from 'react';
import { ArrowLeft, MessageSquare, Lock, Unlock, PanelLeft, PanelRight, ChevronDown, ChevronUp } from 'lucide-react';
import { sanitizeRichText, stripHtml } from '@/utils/richText';

// descripción larga se colapsa con "Ver más" para no empujar el resto del foro fuera de vista
const DESC_COLLAPSE_THRESHOLD = 220;

const ForumHeader = ({
  foro,
  cursoNombre,
  cursoId: _cursoId,
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
    <ForumHeaderContent
      foro={foro}
      cursoNombre={cursoNombre}
      isClosed={isClosed}
      onBack={onBack}
      canManage={canManage}
      onToggleEstado={onToggleEstado}
      togglingEstado={togglingEstado}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={onToggleSidebar}
      activityOpen={activityOpen}
      onToggleActivity={onToggleActivity}
    />
  );
};

const ForumHeaderContent = ({
  foro,
  cursoNombre,
  isClosed,
  onBack,
  canManage,
  onToggleEstado,
  togglingEstado,
  sidebarOpen,
  onToggleSidebar,
  activityOpen,
  onToggleActivity,
}) => {
  const [descExpanded, setDescExpanded] = useState(false);
  const descPlain  = stripHtml(foro?.descripcion);
  const isLongDesc = descPlain.length > DESC_COLLAPSE_THRESHOLD;

  return (
    <div>
      <button type="button" onClick={onBack} className="fm-back">
        <ArrowLeft size={15} />
        Volver a foros
      </button>

      <div className="fm-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0, flex: 1 }}>
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
              <>
                <div className={`fm-desc-wrap${isLongDesc && !descExpanded ? ' is-collapsed' : ''}`}>
                  <div className="fm-desc" dangerouslySetInnerHTML={{ __html: sanitizeRichText(foro.descripcion) }} />
                </div>
                {isLongDesc && (
                  <button type="button" className="fm-desc-toggle" onClick={() => setDescExpanded(v => !v)}>
                    {descExpanded ? 'Ver menos' : 'Ver descripción completa'}
                    {descExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
              </>
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
            aria-pressed={!!activityOpen}
            title={activityOpen ? 'Ocultar estadísticas' : 'Mostrar estadísticas de este foro'}>
            <PanelRight size={15} />
            <span className="fm-action-label">Estadísticas</span>
          </button>

          <button type="button" onClick={onToggleSidebar} className="fm-action" data-active={sidebarOpen || undefined}
            aria-pressed={!!sidebarOpen}
            title={sidebarOpen ? 'Ocultar lista de foros' : 'Ver otros foros del curso'}>
            <PanelLeft size={15} />
            <span className="fm-action-label">Otros foros</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForumHeader;
