// src/features/foros/pages/ForumPage.jsx
// THE canonical forum view. All roles use this same page.
// Route: /curso/:cursoId/foro/:foroId
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

import { useAuthContext } from '../../../features/auth/context/AuthContext';
import { useToast }       from '../../../context/ToastContext';

import {
  useForumDetail,
  useForumMessages,
  useForumsByCourse,
  usePostMessage,
  useLikeMessage,
  useDeleteMessage,
  useEditMessage,
  useToggleEstado,
} from '../hooks/useForumData';
import { useForumPermissions } from '../hooks/useForumPermissions';

import ForumHeader   from '../components/ForumHeader';
import ForumSidebar  from '../components/ForumSidebar';
import ForumMessage  from '../components/ForumMessage';
import ForumInput    from '../components/ForumInput';
import ForumActivity from '../components/ForumActivity';
import { Modal, Button } from '@/components';
import { forosCreate } from '@/lib/apiClient';
import { Field } from '../../cursos/components/shared/ui';

// ─── Skeletons ────────────────────────────────────────────────────────────────

const MsgSkeleton = () => (
  <div style={{ display: 'flex', gap: 12, padding: '10px 12px' }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface-2)',
      flexShrink: 0, animation: 'fm-pulse 1.4s ease-in-out infinite' }} />
    <div style={{ flex: 1 }}>
      <div style={{ width: '30%', height: 12, borderRadius: 4, background: 'var(--color-surface-2)',
        marginBottom: 8, animation: 'fm-pulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: '80%', height: 13, borderRadius: 4, background: 'var(--color-surface-2)',
        marginBottom: 5, animation: 'fm-pulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: '60%', height: 13, borderRadius: 4, background: 'var(--color-surface-2)',
        animation: 'fm-pulse 1.4s ease-in-out infinite' }} />
    </div>
  </div>
);

const EmptyState = ({ canPost }) => (
  <div style={{ textAlign: 'center', padding: '64px 20px' }}>
    <MessageSquare size={40} style={{ color: 'var(--color-border)', margin: '0 auto 12px' }} />
    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
      Aún no hay mensajes
    </p>
    <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)' }}>
      {canPost ? '¡Sé el primero en escribir en este foro!' : 'Próximamente habrá actividad en este foro.'}
    </p>
  </div>
);

// ─── Create Forum Modal ───────────────────────────────────────────────────────

const CreateForumModal = ({ cursoId, onCreated, onClose }) => {
  const [titulo,      setTitulo]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const { notify } = useToast();

  const handleSubmit = async () => {
    if (titulo.trim().length < 5)      { setError('El título debe tener al menos 5 caracteres.'); return; }
    if (descripcion.trim().length < 10){ setError('La descripción debe tener al menos 10 caracteres.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('titulo', titulo.trim());
      fd.append('descripcion', descripcion.trim());
      fd.append('cursoId', cursoId);
      fd.append('publico', 'false');
      await forosCreate(fd);
      notify('Foro creado correctamente', 'success');
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err?.message ?? 'Error al crear el foro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626',
          padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>{error}</div>
      )}
      <Field label="Título *">
        <input value={titulo} onChange={e => setTitulo(e.target.value)}
          placeholder="Mínimo 5 caracteres (máx 200)"
          maxLength={200}
          style={{
            width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-border)',
            borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none',
            background: 'var(--color-surface)', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={e  => e.target.style.borderColor = 'var(--color-border)'}
        />
        <span style={{ fontSize: 11, color: titulo.length < 5 ? '#dc2626' : 'var(--color-text-muted)' }}>
          {titulo.length} / 200
        </span>
      </Field>
      <Field label="Descripción *">
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
          rows={4} maxLength={2000}
          placeholder="Describe de qué trata el foro (mínimo 10 caracteres)"
          style={{
            width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-border)',
            borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
            outline: 'none', background: 'var(--color-surface)', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={e  => e.target.style.borderColor = 'var(--color-border)'}
        />
        <span style={{ fontSize: 11, color: descripcion.length < 10 ? '#dc2626' : 'var(--color-text-muted)' }}>
          {descripcion.length} / 2000
        </span>
      </Field>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end',
        paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit}
          disabled={loading || titulo.trim().length < 5 || descripcion.trim().length < 10}>
          {loading ? 'Creando…' : 'Crear foro'}
        </Button>
      </div>
    </div>
  );
};

// ─── ForumPage ────────────────────────────────────────────────────────────────

const ForumPage = () => {
  const { cursoId, foroId } = useParams();
  const navigate            = useNavigate();
  const location            = useLocation();
  const { user }            = useAuthContext();
  const { notify }          = useToast();

  // Detect mobile breakpoint reactively
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Panel visibility
  const [sidebarOpen,  setSidebarOpen]  = useState(!isMobile);
  const [activityOpen, setActivityOpen] = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);

  // Close sidebar automatically when navigating to a different forum on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [foroId, isMobile]);

  // Reply / UI state
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);

  // Permissions
  const perms = useForumPermissions(user);

  // Data
  const { data: foro,     isLoading: foroLoading }    = useForumDetail(foroId);
  const { data: mensajes = [], isLoading: msgLoading } = useForumMessages(foroId);
  const { data: forums   = [], refetch: refetchForums } = useForumsByCourse(cursoId);

  // Mutations
  const postMutation   = usePostMessage(foroId);
  const likeMutation   = useLikeMessage(foroId);
  const deleteMutation = useDeleteMessage(foroId);
  const editMutation   = useEditMessage(foroId);
  const estadoMutation = useToggleEstado(foroId);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handlePost = (contenido, files, respuestaA) => {
    const fd = new FormData();
    fd.append('foroId', foroId);
    fd.append('contenido', contenido);
    if (respuestaA) fd.append('respuestaA', respuestaA);
    files.forEach(f => fd.append('archivos', f));

    postMutation.mutate(fd, {
      onSuccess: () => {
        setReplyTo(null);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
      },
      onError: (err) => notify(err?.message ?? 'No se pudo enviar el mensaje', 'error'),
    });
  };

  const handleLike = (msgId) => {
    likeMutation.mutate(msgId, {
      onError: () => notify('No se pudo actualizar el like', 'error'),
    });
  };

  const handleDelete = (msgId) => {
    deleteMutation.mutate(msgId, {
      onSuccess: () => notify('Mensaje eliminado', 'info'),
      onError:   (err) => notify(err?.message ?? 'No se pudo eliminar', 'error'),
    });
  };

  const handleEdit = ({ id, contenido }) => {
    editMutation.mutate({ id, contenido }, {
      onSuccess: () => notify('Mensaje actualizado', 'success'),
      onError:   (err) => notify(err?.message ?? 'No se pudo editar', 'error'),
    });
  };

  const handleToggleEstado = () => {
    const nuevoEstado = foro?.estado === 'cerrado' ? 'abierto' : 'cerrado';
    estadoMutation.mutate({ estado: nuevoEstado }, {
      onSuccess: () => notify(`Foro ${nuevoEstado}`, 'success'),
      onError:   (err) => notify(err?.message ?? 'Error al cambiar estado', 'error'),
    });
  };

  // Derive curso name from navigation state or forum data
  const cursoNombre = location.state?.cursoNombre ?? foro?.curso?.nombre ?? null;

  return (
    <>
      {/* Injected CSS */}
      <style>{FORUM_CSS}</style>

      <div className="fm-root">
        <ForumHeader
          foro={foro}
          cursoNombre={cursoNombre}
          cursoId={cursoId}
          loading={foroLoading}
          onBack={() => navigate(`/cursos/${cursoId}?tab=foros`)}
          canManage={perms.canManageForum}
          onToggleEstado={handleToggleEstado}
          togglingEstado={estadoMutation.isPending}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(p => !p)}
          activityOpen={activityOpen}
          onToggleActivity={() => setActivityOpen(p => !p)}
        />

        <div className="fm-body">
          {/* Mobile overlay — dims content behind the open sidebar */}
          {sidebarOpen && isMobile && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position:       'fixed',
                inset:          0,
                zIndex:         39,
                background:     'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(1px)',
              }}
            />
          )}

          {/* Left sidebar — always in DOM so CSS transition works */}
          <div className={`fm-sidebar${sidebarOpen ? ' open' : ''}`}>
            <ForumSidebar
              forums={forums}
              currentId={foroId}
              cursoId={cursoId}
              canCreate={perms.canCreateForum}
              onCreateClick={() => setShowCreate(true)}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Center — messages + input */}
          <main className="fm-main">
            {msgLoading ? (
              <div className="fm-messages-scroll">
                {Array.from({ length: 5 }).map((_, i) => <MsgSkeleton key={i} />)}
              </div>
            ) : (
              <div className="fm-messages-scroll">
                {mensajes.length === 0
                  ? <EmptyState canPost={perms.canPostMessage} />
                  : mensajes.map(msg => (
                      <ForumMessage
                        key={msg._id}
                        msg={msg}
                        userId={perms.userId}
                        canEdit={perms.canEditMessage(msg.autorId ?? msg.autor?._id)}
                        canDelete={perms.canDeleteMessage(msg.autorId ?? msg.autor?._id)}
                        onReply={setReplyTo}
                        onLike={handleLike}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                    ))
                }
                <div ref={messagesEndRef} style={{ height: 1 }} />
              </div>
            )}

            {perms.canPostMessage && (
              <ForumInput
                foro={foro}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
                onSubmit={handlePost}
                loading={postMutation.isPending}
              />
            )}
          </main>

          {/* Right panel */}
          {activityOpen && (
            <div className="fm-activity">
              <ForumActivity foro={foro} mensajes={mensajes} />
            </div>
          )}
        </div>
      </div>

      {/* Create forum modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nuevo foro"
        size="md"
      >
        <CreateForumModal
          cursoId={cursoId}
          onCreated={refetchForums}
          onClose={() => setShowCreate(false)}
        />
      </Modal>
    </>
  );
};

export default ForumPage;

// ─── CSS ──────────────────────────────────────────────────────────────────────
const FORUM_CSS = `
@keyframes fm-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes fm-spin   { to { transform: rotate(360deg); } }

/* ── Root ── */
.fm-root {
  display:        flex;
  flex-direction: column;
  height:         calc(100dvh - 64px);
  overflow:       hidden;
  background:     var(--color-bg);
  position:       relative;
}

/* ── Body ── */
.fm-body {
  display:  flex;
  flex:     1;
  overflow: hidden;
  position: relative;
}

/* ── Sidebar ── */
.fm-sidebar {
  width:        240px;
  flex-shrink:  0;
  border-right: 1px solid var(--color-border);
  overflow-y:   auto;
  background:   var(--color-surface);
  transition:   transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Main center ── */
.fm-main {
  flex:           1;
  display:        flex;
  flex-direction: column;
  min-width:      0;
  overflow:       hidden;
  background:     var(--color-surface);
}

.fm-messages-scroll {
  flex:            1;
  overflow-y:      auto;
  padding:         12px 16px 8px;
  scroll-behavior: smooth;
}

/* ── Activity panel ── */
.fm-activity {
  width:        260px;
  flex-shrink:  0;
  border-left:  1px solid var(--color-border);
  overflow-y:   auto;
  background:   var(--color-surface);
}

/* ── Tablet 768–1100 ── */
@media (max-width: 1100px) {
  .fm-activity { display: none; }
  .fm-sidebar  { width: 200px; }
}

/* ── Mobile < 768 ── */
@media (max-width: 767px) {
  .fm-sidebar {
    position:   fixed;
    top:        64px;
    left:       0;
    bottom:     0;
    width:      280px;
    z-index:    40;
    transform:  translateX(-100%);
    border-right: none;
  }
  .fm-sidebar.open {
    transform:  translateX(0);
    box-shadow: 6px 0 24px rgba(0,0,0,0.18);
  }
  .fm-messages-scroll {
    padding: 8px 10px 4px;
  }
  .fm-breadcrumb      { display: none !important; }
  .fm-toggle-activity { display: none !important; }
}

/* ── Mobile XS < 400 ── */
@media (max-width: 400px) {
  .fm-action-label { display: none; }
  .fm-sidebar      { width: 100vw; }
}
`;
