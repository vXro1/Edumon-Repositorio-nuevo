// src/features/foros/components/ForumActivity.jsx
// Right panel: participants, stats, and recent file attachments.
import { useState } from 'react';
import { Users, BarChart2, Paperclip, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `hace ${days}d`;
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(iso));
};

const ROL_COLOR = {
  docente:       '#6d28d9',
  estudiante:    '#1d4ed8',
  padre:         '#047857',
  'padre/tutor': '#047857',
  administrador: '#b45309',
  superadmin:    '#b91c1c',
};

const MiniAvatar = ({ autor }) => {
  const [err, setErr] = useState(false);
  const src = autor?.fotoPerfilUrl ?? autor?.avatar;
  const c   = ROL_COLOR[autor?.rol] ?? 'var(--color-primary)';
  const init = ((autor?.nombre?.[0] ?? '') + (autor?.apellido?.[0] ?? '')).toUpperCase() || 'U';

  return (
    <div title={`${autor?.nombre ?? ''} ${autor?.apellido ?? ''}`}
      style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: src && !err ? 'transparent' : `${c}1a`,
        border: `2px solid ${c}44`,
        fontSize: 10, fontWeight: 700, color: c,
      }}>
      {src && !err
        ? <img src={src} alt="" onError={() => setErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : init
      }
    </div>
  );
};

const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 20 }}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px',
          borderBottom: open ? '1px solid var(--color-border)' : 'none', marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--color-text-muted)',
        }}>
          <Icon size={12} />
          {title}
        </span>
        {open ? <ChevronUp size={13} style={{ color: 'var(--color-text-muted)' }} />
               : <ChevronDown size={13} style={{ color: 'var(--color-text-muted)' }} />}
      </button>
      {open && children}
    </div>
  );
};

const ForumActivity = ({ foro, mensajes = [] }) => {
  // Derive participants from messages (unique authors)
  const participantMap = new Map();
  mensajes.forEach(m => {
    if (m.autor?._id && !participantMap.has(m.autor._id)) {
      participantMap.set(m.autor._id, m.autor);
    }
    (m.respuestas ?? []).forEach(r => {
      if (r.autor?._id && !participantMap.has(r.autor._id)) {
        participantMap.set(r.autor._id, r.autor);
      }
    });
  });
  const participants = Array.from(participantMap.values());

  // Collect all files from messages
  const allFiles = [];
  mensajes.forEach(m => {
    (m.archivos ?? []).forEach(a => allFiles.push({ ...a, autor: m.autor, createdAt: m.createdAt }));
    (m.respuestas ?? []).forEach(r => {
      (r.archivos ?? []).forEach(a => allFiles.push({ ...a, autor: r.autor, createdAt: r.createdAt }));
    });
  });
  const recentFiles = allFiles.slice(-8).reverse();

  const totalRespuestas = mensajes.reduce((acc, m) => acc + (m.respuestas?.length ?? 0), 0);
  const lastActivity = mensajes[mensajes.length - 1]?.createdAt;

  return (
    <aside style={{
      width:      '100%',
      padding:    '18px 14px',
      boxSizing:  'border-box',
    }}>

      {/* Stats section */}
      <Section title="Estadísticas" icon={BarChart2}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Mensajes',    value: foro?.totalMensajes ?? mensajes.length },
            { label: 'Respuestas',  value: totalRespuestas },
            { label: 'Participantes', value: participants.length },
            { label: 'Archivos',    value: allFiles.length },
          ].map(s => (
            <div key={s.label} style={{
              background:   'var(--color-surface-2)',
              borderRadius: 10,
              padding:      '10px 10px',
              textAlign:    'center',
            }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text)',
                fontFamily: 'var(--font-display)' }}>
                {s.value}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 10.5, color: 'var(--color-text-muted)',
                fontWeight: 600 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Estado */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            display:      'inline-flex', alignItems: 'center', gap: 5,
            padding:      '3px 10px', borderRadius: 9999, fontSize: 11.5, fontWeight: 700,
            background:   foro?.estado === 'cerrado' ? '#fee2e2' : '#d1fae5',
            color:        foro?.estado === 'cerrado' ? '#dc2626' : '#059669',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: foro?.estado === 'cerrado' ? '#dc2626' : '#10b981',
              display: 'inline-block',
            }} />
            {foro?.estado === 'cerrado' ? 'Cerrado' : 'Abierto'}
          </span>
          {lastActivity && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Última actividad {timeAgo(lastActivity)}
            </span>
          )}
        </div>
      </Section>

      {/* Participants section */}
      {participants.length > 0 && (
        <Section title="Participantes" icon={Users}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {participants.slice(0, 8).map(p => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <MiniAvatar autor={p} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600,
                    color: 'var(--color-text)', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.nombre} {p.apellido}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)',
                    textTransform: 'capitalize' }}>
                    {p.rol}
                  </p>
                </div>
              </div>
            ))}
            {participants.length > 8 && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                +{participants.length - 8} más
              </p>
            )}
          </div>
        </Section>
      )}

      {/* Files section */}
      {recentFiles.length > 0 && (
        <Section title="Archivos" icon={Paperclip} defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentFiles.map((f, i) => (
              <a key={f._id ?? i} href={f.url} target="_blank" rel="noreferrer"
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            8,
                  padding:        '6px 8px',
                  borderRadius:   8,
                  background:     'var(--color-surface-2)',
                  border:         '1px solid var(--color-border)',
                  textDecoration: 'none',
                  color:          'var(--color-text)',
                  transition:     'background 0.15s',
                  fontSize:       12,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
              >
                <FileText size={14} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.nombre ?? 'Archivo'}
                </span>
              </a>
            ))}
          </div>
        </Section>
      )}
    </aside>
  );
};

export default ForumActivity;
