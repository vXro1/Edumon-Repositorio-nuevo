// src/features/foros/components/ForumMessage.jsx
import { useState } from 'react';
import { Heart, MessageSquare, Pencil, Trash2, Check, X, FileText } from 'lucide-react';
import { UserAvatar, Button } from '@/components';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  docente:       { bg: 'rgba(124,58,237,0.10)', color: '#6d28d9', label: 'Docente'    },
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
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9999,
      background: s.bg, color: s.color, letterSpacing: '0.03em',
    }}>
      {s.label}
    </span>
  );
};

const FilePreview = ({ archivo }) => {
  const tipo = (archivo.tipoArchivo ?? archivo.tipo ?? '').toLowerCase();
  const isImg = tipo.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(archivo.url ?? '');
  const isVid = tipo.startsWith('video/');

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

  return (
    <a href={archivo.url} target="_blank" rel="noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
        padding: '6px 12px', borderRadius: 8,
        background: 'var(--color-surface-2, #f3f4f6)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text)', fontSize: 12.5, fontWeight: 500,
        textDecoration: 'none',
      }}>
      <FileText size={14} style={{ flexShrink: 0 }} />
      <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {archivo.nombre ?? 'Archivo'}
      </span>
    </a>
  );
};

// ─── ForumReply ───────────────────────────────────────────────────────────────

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
      {/* Thread line */}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike?.(reply._id)}
            leftIcon={
              <Heart size={12}
                fill={reply.yaLeDioLike ? '#e11d48' : 'none'}
                stroke={reply.yaLeDioLike ? '#e11d48' : 'currentColor'} />
            }
            style={reply.yaLeDioLike ? { color: '#e11d48' } : {}}
          >
            {reply.totalLikes > 0 ? reply.totalLikes : null}
          </Button>

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
              <span style={{ color: '#dc2626', fontWeight: 600 }}>¿Eliminar?</span>
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

// ─── ForumMessage ─────────────────────────────────────────────────────────────

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
        {/* Header row */}
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

        {/* Content or edit textarea */}
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

        {/* File attachments */}
        {!editing && msg.archivos?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {msg.archivos.map((a, i) => <FilePreview key={a._id ?? i} archivo={a} />)}
          </div>
        )}

        {/* Action bar */}
        {!editing && (
          <div style={{
            display:    'flex', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap',
            opacity:    hovered ? 1 : 0.5, transition: 'opacity 0.15s',
          }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike?.(msg._id)}
              leftIcon={
                <Heart size={14}
                  fill={msg.yaLeDioLike ? '#e11d48' : 'none'}
                  stroke={msg.yaLeDioLike ? '#e11d48' : 'currentColor'} />
              }
              style={msg.yaLeDioLike ? { color: '#e11d48' } : {}}
            >
              {msg.totalLikes > 0 ? msg.totalLikes : null}
            </Button>

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
                <span style={{ color: '#dc2626', fontWeight: 600 }}>¿Eliminar?</span>
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

        {/* Nested replies */}
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
