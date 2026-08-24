// src/features/foros/components/ForumMessage.jsx
import { useState } from 'react';
import { Heart, MessageSquare, Pencil, Trash2, Check, X, FileText } from 'lucide-react';
import { UserAvatar, Button } from '@/components';

// ─── Utilidades ──────────────────────────────────────────────────────────────

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

const authorName = (autor) =>
  [autor?.nombre, autor?.apellido].filter(Boolean).join(' ') || 'Usuario';

const ROLE_STYLE = {
  docente:       { bg: 'rgba(5,199,242,0.12)',  color: '#0392B4', label: 'Docente'    },
  estudiante:    { bg: 'rgba(37,99,235,0.10)',  color: '#1d4ed8', label: 'Estudiante' },
  padre:         { bg: 'rgba(5,150,105,0.10)',  color: '#047857', label: 'Padre'      },
  'padre/tutor': { bg: 'rgba(5,150,105,0.10)',  color: '#047857', label: 'Tutor'      },
  administrador: { bg: 'rgba(217,119,6,0.10)',  color: '#b45309', label: 'Admin'      },
  superadmin:    { bg: 'rgba(220,38,38,0.10)',  color: '#b91c1c', label: 'Super'      },
};

const RoleBadge = ({ rol }) => {
  const s = ROLE_STYLE[rol];
  if (!s) return null;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 9999,
      background: s.bg, color: s.color, letterSpacing: '0.01em',
      boxShadow: 'var(--clay-pill)',
    }}>
      {s.label}
    </span>
  );
};

const FilePreview = ({ archivo }) => {
  const tipo = (archivo.tipoArchivo ?? archivo.tipo ?? '').toLowerCase();
  const isImg = tipo.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(archivo.url ?? '');
  const isVid = tipo.startsWith('video/');
  const isPdf = tipo.includes('pdf') || /\.pdf$/i.test(archivo.url ?? '');

  if (isImg) return (
    <a href={archivo.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 6 }}>
      <img src={archivo.url} alt={archivo.nombre}
        style={{ maxWidth: 280, maxHeight: 200, borderRadius: 8, objectFit: 'cover',
          border: '1px solid var(--color-border)' }} />
    </a>
  );

  if (isVid) return (
    <video src={archivo.url} controls
      style={{ display: 'block', maxWidth: 280, borderRadius: 8, marginTop: 6,
        border: '1px solid var(--color-border)' }} />
  );

  // PDF u otro archivo sin vista previa nativa en el navegador: no basta con
  // el nombre como enlace — debe quedar claro qué TIPO de archivo es y qué
  // acción hace el clic ("Ver archivo"), no solo un texto azul suelto.
  const ext = (archivo.nombre ?? '').split('.').pop()?.toUpperCase() || (isPdf ? 'PDF' : 'ARCHIVO');
  return (
    <a href={archivo.url} target="_blank" rel="noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 6,
        padding: '7px 12px 7px 8px', borderRadius: 8,
        background: isPdf ? '#FEE2E2' : 'var(--color-surface-2, #f3f4f6)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text)', fontSize: 12.5,
        textDecoration: 'none', maxWidth: '100%', boxSizing: 'border-box',
      }}>
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
        background: isPdf ? '#FCA5A5' : 'var(--color-border)',
        color: isPdf ? '#7F1D1D' : 'var(--color-text-muted)',
        fontSize: 8.5, fontWeight: 800,
      }}>
        {isPdf ? <FileText size={13} /> : ext.slice(0, 4)}
      </span>
      <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
          {archivo.nombre ?? 'Archivo adjunto'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
          Ver archivo
        </span>
      </span>
    </a>
  );
};

// ─── Botón de like animado ─────────────────────────────────────────────────
// Antes el corazón cambiaba de outline a relleno sin ninguna transición —
// un salto instantáneo. Este componente centraliza el "pop" (spring-easing)
// al dar like, reutilizado por el mensaje raíz y por cada respuesta.
const LikeButton = ({ liked, count, size = 14, onLike }) => {
  const [popping, setPopping] = useState(false);

  const handleClick = () => {
    if (!liked) {
      setPopping(true);
      setTimeout(() => setPopping(false), 320);
    }
    onLike?.();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      leftIcon={
        <Heart
          size={size}
          fill={liked ? '#e11d48' : 'none'}
          stroke={liked ? '#e11d48' : 'currentColor'}
          style={{
            transform: popping ? 'scale(1.4)' : 'scale(1)',
            transition: popping
              ? 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'transform 160ms ease-out',
          }}
        />
      }
      style={liked ? { color: '#e11d48', fontWeight: 700 } : {}}
    >
      {/* Nunca solo el número: sin la palabra "Me gusta" el botón (icono +
          número suelto) es ambiguo — no queda claro qué acción hace ni si
          ya se presionó. */}
      Me gusta{count > 0 ? ` ${count}` : ''}
    </Button>
  );
};

// ─── Respuesta del foro ───────────────────────────────────────────────────────

const ForumReply = ({ reply, userId, canDelete, canEdit, onLike, onDelete, onEdit }) => {
  const [editing,    setEditing]    = useState(false);
  const [editText,   setEditText]   = useState(reply.contenido ?? '');
  const [delConfirm, setDelConfirm] = useState(false);

  const handleSaveEdit = () => {
    if (editText.trim() === reply.contenido) { setEditing(false); return; }
    onEdit?.({ id: reply._id, contenido: editText.trim() });
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', gap: 10, paddingLeft: 12, position: 'relative', paddingTop: 10 }}>
      {/* Línea de hilo */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 2, background: 'var(--color-border)', borderRadius: 2,
      }} />

      <UserAvatar user={reply.autor} size={28} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
            {authorName(reply.autor)}
          </span>
          <RoleBadge rol={reply.autor?.rol} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 2 }}>
            {timeAgo(reply.createdAt)}
          </span>
          {reply.editado && (
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              (editado)
            </span>
          )}
        </div>

        {editing ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={2}
              style={{
                flex: 1, resize: 'none', border: '1.5px solid var(--color-primary)',
                borderRadius: 8, padding: '6px 10px', fontSize: 13.5,
                fontFamily: 'inherit', outline: 'none', background: 'var(--color-surface)',
              }}
              autoFocus
            />
            <Button variant="primary" size="sm" onClick={handleSaveEdit} leftIcon={<Check size={12} />}>
              Guardar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} leftIcon={<X size={12} />}>
              Cancelar
            </Button>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55,
            color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {reply.contenido}
          </p>
        )}

        {reply.archivos?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {reply.archivos.map((a, i) => <FilePreview key={a._id ?? i} archivo={a} />)}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          <LikeButton
            liked={reply.yaLeDioLike}
            count={reply.totalLikes}
            size={12}
            onLike={() => onLike?.(reply._id)}
          />

          {canEdit && !editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} leftIcon={<Pencil size={11} />}>
              <span className="fm-action-label">Editar</span>
            </Button>
          )}

          {canDelete && !delConfirm && (
            <Button variant="ghost" size="sm" onClick={() => setDelConfirm(true)} leftIcon={<Trash2 size={11} />}>
              <span className="fm-action-label">Eliminar</span>
            </Button>
          )}

          {delConfirm && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--color-error-hover)', fontWeight: 600 }}>¿Eliminar?</span>
              <Button variant="danger" size="xs" onClick={() => { onDelete?.(reply._id); setDelConfirm(false); }}>
                Sí
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setDelConfirm(false)}>
                No
              </Button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Mensaje del foro ─────────────────────────────────────────────────────────

const ForumMessage = ({
  msg,
  userId,
  canEdit,
  canDelete,
  onReply,
  onLike,
  onDelete,
  onEdit,
}) => {
  const [editing,    setEditing]    = useState(false);
  const [editText,   setEditText]   = useState(msg.contenido ?? '');
  const [delConfirm, setDelConfirm] = useState(false);
  const [hovered,    setHovered]    = useState(false);

  const handleSaveEdit = () => {
    if (editText.trim() === msg.contenido) { setEditing(false); return; }
    onEdit?.({ id: msg._id, contenido: editText.trim() });
    setEditing(false);
  };

  const isStaff = ['docente', 'administrador', 'superadmin'].includes(msg.autor?.rol);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      'flex',
        gap:          12,
        padding:      '12px 14px',
        borderRadius: 12,
        marginBottom: 4,
        background:   hovered ? 'var(--color-surface-2, #f8f9fa)' : 'transparent',
        transition:   'background 0.12s',
        position:     'relative',
        borderLeft:   isStaff ? '3px solid var(--color-primary)' : '3px solid transparent',
      }}
    >
      <UserAvatar user={msg.autor} size={36} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Fila de encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
            {authorName(msg.autor)}
          </span>
          <RoleBadge rol={msg.autor?.rol} />
          <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>
            {timeAgo(msg.createdAt)}
          </span>
          {msg.editado && (
            <span style={{ fontSize: 10.5, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              (editado)
            </span>
          )}
        </div>

        {/* Contenido o área de edición */}
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={3}
              style={{
                width: '100%', resize: 'vertical', border: '1.5px solid var(--color-primary)',
                borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: 'inherit',
                outline: 'none', background: 'var(--color-surface)', boxSizing: 'border-box',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="sm" onClick={handleSaveEdit} leftIcon={<Check size={13} />}>
                Guardar
              </Button>
              <Button variant="ghost" size="sm"
                onClick={() => { setEditing(false); setEditText(msg.contenido ?? ''); }}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p style={{
            margin: 0, fontSize: 14, lineHeight: 1.6,
            color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {msg.contenido}
          </p>
        )}

        {/* Archivos adjuntos */}
        {!editing && msg.archivos?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {msg.archivos.map((a, i) => <FilePreview key={a._id ?? i} archivo={a} />)}
          </div>
        )}

        {/* Barra de acciones */}
        {!editing && (
          <div style={{
            display:    'flex', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap',
            opacity:    hovered ? 1 : 0.5, transition: 'opacity 0.15s',
          }}>
            <LikeButton
              liked={msg.yaLeDioLike}
              count={msg.totalLikes}
              size={14}
              onLike={() => onLike?.(msg._id)}
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply?.(msg)}
              leftIcon={<MessageSquare size={13} />}
            >
              <span className="fm-action-label">Responder</span>
              {msg.respuestas?.length > 0 && (
                <span style={{
                  marginLeft: 4, fontSize: 11,
                  background: 'var(--color-surface-2)',
                  padding: '1px 6px', borderRadius: 9999, fontWeight: 600,
                }}>
                  {msg.respuestas.length}
                </span>
              )}
            </Button>

            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} leftIcon={<Pencil size={12} />}>
                <span className="fm-action-label">Editar</span>
              </Button>
            )}

            {canDelete && !delConfirm && (
              <Button variant="ghost" size="sm" onClick={() => setDelConfirm(true)} leftIcon={<Trash2 size={12} />}>
                <span className="fm-action-label">Eliminar</span>
              </Button>
            )}

            {delConfirm && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ color: 'var(--color-error-hover)', fontWeight: 600 }}>¿Eliminar?</span>
                <Button variant="danger" size="xs"
                  onClick={() => { onDelete?.(msg._id); setDelConfirm(false); }}>
                  Sí
                </Button>
                <Button variant="ghost" size="xs" onClick={() => setDelConfirm(false)}>
                  No
                </Button>
              </span>
            )}
          </div>
        )}

        {/* Respuestas anidadas */}
        {msg.respuestas?.length > 0 && (
          <div style={{ marginTop: 12, paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {msg.respuestas.map(reply => (
              <ForumReply
                key={reply._id}
                reply={reply}
                userId={userId}
                canEdit={canEdit && String(reply.autorId) === String(userId)}
                canDelete={canDelete}
                onLike={onLike}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumMessage;
