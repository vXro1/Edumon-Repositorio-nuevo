// src/features/foros/pages/ForumPage.jsx
// Vista canónica del foro. Todos los roles usan esta misma página.
// Ruta: /curso/:cursoId/foro/:foroId
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Paperclip, X, FileText } from 'lucide-react';

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
import { forosCreate } from '@/features/foros/services/forosService';
import { Field } from '../../cursos/components/shared/ui';

// ─── Esqueletos de carga ──────────────────────────────────────────────────────

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

// ─── Modal de creación de foro ────────────────────────────────────────────────

const MAX_MATERIALES = 5;

// El backend (foroRoutes.js) acepta hasta 5 archivos de máx. 10MB cada uno:
// imágenes, video (mp4/mpeg/quicktime) y PDF.
const MaterialPill = ({ file, onRemove }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'var(--color-surface-2, #f3f4f6)', border: '1px solid var(--color-border)',
    borderRadius: 20, padding: '3px 10px', fontSize: 12,
  }}>
    <FileText size={11} style={{ flexShrink: 0 }} />
    <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {file.name}
    </span>
    <button onClick={() => onRemove(file)} type="button"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        color: 'var(--color-text-muted)', display: 'flex', lineHeight: 1 }}>
      <X size={11} />
    </button>
  </div>
);

const CreateForumModal = ({ cursoId, onCreated, onClose }) => {
  const [titulo,      setTitulo]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [materiales,  setMateriales]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const fileRef = useRef(null);
  const { notify } = useToast();

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files ?? []);
    setMateriales(prev => [...prev, ...picked].slice(0, MAX_MATERIALES));
    e.target.value = '';
  };
  const removeMaterial = (file) => setMateriales(prev => prev.filter(f => f !== file));

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
      materiales.forEach(f => fd.append('archivos', f));
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
        <div style={{ background: '#fee2e2', color: 'var(--color-error-hover)',
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
        <span style={{ fontSize: 11, color: titulo.length < 5 ? 'var(--color-error-hover)' : 'var(--color-text-muted)' }}>
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
        <span style={{ fontSize: 11, color: descripcion.length < 10 ? 'var(--color-error-hover)' : 'var(--color-text-muted)' }}>
          {descripcion.length} / 2000
        </span>
      </Field>
      <Field label="Materiales de apoyo (opcional)">
        {materiales.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {materiales.map((f, i) => <MaterialPill key={i} file={f} onRemove={removeMaterial} />)}
          </div>
        )}
        <button type="button" onClick={() => fileRef.current?.click()}
          disabled={materiales.length >= MAX_MATERIALES}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: '1.5px dashed var(--color-border)',
            borderRadius: 8, padding: '8px 14px',
            cursor: materiales.length >= MAX_MATERIALES ? 'not-allowed' : 'pointer',
            fontSize: 12.5, color: 'var(--color-text-muted)',
            opacity: materiales.length >= MAX_MATERIALES ? 0.5 : 1,
          }}>
          <Paperclip size={13} />
          Adjuntar imágenes, video o PDF ({materiales.length}/{MAX_MATERIALES})
        </button>
        <input ref={fileRef} type="file" style={{ display: 'none' }}
          multiple accept="image/*,video/mp4,video/mpeg,video/quicktime,.pdf"
          onChange={handleFileChange} />
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

// ─── Página del foro ──────────────────────────────────────────────────────────

const ForumPage = () => {
  const { cursoId, foroId } = useParams();
  const navigate            = useNavigate();
  const location            = useLocation();
  const { user }            = useAuthContext();
  const { notify }          = useToast();

  // Punto de quiebre "compacto": por debajo de 1100px no cabe el layout de
  // 3 columnas (sidebar + mensajes + actividad), así que ambos paneles
  // laterales pasan a ser overlays deslizantes en vez de columnas fijas.
  // Antes el panel de actividad simplemente se ocultaba con
  // `display:none` por debajo de 1100px SIN ninguna forma de volver a
  // abrirlo — estadísticas, participantes y materiales de apoyo eran
  // inaccesibles en tablet/móvil aunque el botón para abrirlos siguiera
  // visible entre 768 y 1100px (no hacía nada).
  const [isCompact, setIsCompact] = useState(() => window.innerWidth < 1100);
  useEffect(() => {
    const fn = () => setIsCompact(window.innerWidth < 1100);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Visibilidad de los paneles — en pantallas compactas ambos arrancan
  // cerrados (son overlays que tapan el contenido); en escritorio ambos
  // arrancan abiertos (son columnas fijas).
  const [sidebarOpen,  setSidebarOpen]  = useState(!isCompact);
  const [activityOpen, setActivityOpen] = useState(!isCompact);
  const [showCreate,   setShowCreate]   = useState(false);

  // Cerrar los paneles automáticamente al navegar a otro foro en pantallas
  // compactas, y al cruzar el punto de quiebre (evita quedar con un overlay
  // abierto que de repente pasa a ser columna fija a medio abrir, o viceversa).
  useEffect(() => {
    if (isCompact) { setSidebarOpen(false); setActivityOpen(false); }
    else { setSidebarOpen(true); setActivityOpen(true); }
  }, [foroId, isCompact]);

  // En pantallas compactas solo un overlay a la vez — abrir uno cierra el otro.
  const toggleSidebar = () => setSidebarOpen(prev => {
    const next = !prev;
    if (next && isCompact) setActivityOpen(false);
    return next;
  });
  const toggleActivity = () => setActivityOpen(prev => {
    const next = !prev;
    if (next && isCompact) setSidebarOpen(false);
    return next;
  });

  // Estado de respuesta / UI
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);

  // Permisos
  const perms = useForumPermissions(user);

  // Datos
  const { data: foro,     isLoading: foroLoading }    = useForumDetail(foroId);
  const { data: mensajes = [], isLoading: msgLoading } = useForumMessages(foroId, perms.userId);
  const { data: forums   = [], refetch: refetchForums } = useForumsByCourse(cursoId);

  // Mutaciones
  const postMutation   = usePostMessage(foroId);
  const likeMutation   = useLikeMessage(foroId, perms.userId);
  const deleteMutation = useDeleteMessage(foroId);
  const editMutation   = useEditMessage(foroId);
  const estadoMutation = useToggleEstado(foroId);

  // ─── Manejadores ─────────────────────────────────────────────────────────
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

  // Obtener el nombre del curso desde el estado de navegación o los datos del foro
  const cursoNombre = location.state?.cursoNombre ?? foro?.curso?.nombre ?? null;

  return (
    <>
      {/* CSS inyectado */}
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
          onToggleSidebar={toggleSidebar}
          activityOpen={activityOpen}
          onToggleActivity={toggleActivity}
        />

        <div className="fm-body">
          {/* Capa de oscurecimiento en pantallas compactas — atenúa el
              contenido detrás de CUALQUIERA de los dos paneles overlay */}
          {isCompact && (sidebarOpen || activityOpen) && (
            <div
              onClick={() => { setSidebarOpen(false); setActivityOpen(false); }}
              style={{
                position:       'fixed',
                inset:          0,
                zIndex:         39,
                background:     'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(1px)',
              }}
            />
          )}

          {/* Sidebar izquierdo — siempre en el DOM para que funcione la transición CSS */}
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

          {/* Centro — mensajes + entrada */}
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

          {/* Panel derecho — siempre en el DOM (mismo motivo que el sidebar):
              por debajo de 1100px se vuelve un overlay deslizante en vez de
              desaparecer con display:none sin forma de reabrirlo. */}
          <div className={`fm-activity${activityOpen ? ' open' : ''}`}>
            {isCompact && (
              <button
                type="button"
                onClick={() => setActivityOpen(false)}
                aria-label="Cerrar panel de actividad"
                style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 1,
                  background: 'var(--color-surface-2)', border: 'none',
                  borderRadius: 8, padding: 6, cursor: 'pointer',
                  color: 'var(--color-text-muted)', display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            )}
            <ForumActivity foro={foro} mensajes={mensajes} />
          </div>
        </div>
      </div>

      {/* Modal de creación de foro */}
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

// ─── Estilos CSS ──────────────────────────────────────────────────────────────
//
// Modelo responsivo (>=1100px vs <1100px "compacto"):
//   - Escritorio: sidebar y actividad son columnas fijas dentro del layout de
//     3 paneles. El botón de alternar cada uno los saca/mete del flujo
//     (antes el toggle no tenía ningún efecto visual en escritorio).
//   - Compacto (tableta y móvil, <1100px): ambos paneles se despegan del
//     flujo y se vuelven overlays deslizantes (sidebar desde la izquierda,
//     actividad desde la derecha), con fondo oscurecido — el mismo patrón
//     que ya tenía el sidebar en móvil, ahora aplicado también a actividad.
//     Antes, por debajo de 1100px, .fm-activity se ocultaba con
//     display:none SIN ninguna forma de reabrirlo — estadísticas,
//     participantes y materiales de apoyo eran inaccesibles en tablet/móvil.
const FORUM_CSS = `
@keyframes fm-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes fm-spin   { to { transform: rotate(360deg); } }

/* ── Raíz ── */
.fm-root {
  display:        flex;
  flex-direction: column;
  height:         calc(100dvh - 64px);
  overflow:       hidden;
  background:     var(--color-bg);
  position:       relative;
}

/* ── Cuerpo ── */
.fm-body {
  display:  flex;
  flex:     1;
  overflow: hidden;
  position: relative;
}

/* ── Barra lateral ── */
.fm-sidebar {
  width:        240px;
  flex-shrink:  0;
  border-right: 1px solid var(--color-border);
  overflow-y:   auto;
  background:   var(--color-surface);
  transition:   transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
}
.fm-sidebar:not(.open) { display: none; }

/* ── Centro principal ── */
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

/* ── Panel de actividad ── */
.fm-activity {
  width:        260px;
  flex-shrink:  0;
  border-left:  1px solid var(--color-border);
  overflow-y:   auto;
  background:   var(--color-surface);
  position:     relative;
  transition:   transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
}
.fm-activity:not(.open) { display: none; }

/* ── Compacto: tableta y móvil, <1100px ── */
@media (max-width: 1100px) {
  .fm-sidebar {
    position:     fixed;
    top:          64px;
    left:         0;
    bottom:       0;
    width:        280px;
    max-width:    85vw;
    z-index:      40;
    display:      block;
    transform:    translateX(-100%);
    border-right: none;
  }
  .fm-sidebar.open {
    transform:  translateX(0);
    box-shadow: 6px 0 24px rgba(0,0,0,0.18);
  }

  .fm-activity {
    position:    fixed;
    top:         64px;
    right:       0;
    bottom:      0;
    width:       300px;
    max-width:   85vw;
    z-index:     40;
    display:     block;
    transform:   translateX(100%);
    border-left: none;
    padding-top: 36px; /* deja sitio al botón de cerrar */
  }
  .fm-activity.open {
    transform:  translateX(0);
    box-shadow: -6px 0 24px rgba(0,0,0,0.18);
  }
}

/* ── Móvil < 768 ── */
@media (max-width: 767px) {
  .fm-messages-scroll {
    padding: 8px 10px 4px;
  }
  .fm-breadcrumb { display: none !important; }
}

/* ── Móvil XS < 400 ── */
@media (max-width: 400px) {
  .fm-action-label { display: none; }
  .fm-sidebar, .fm-activity { width: 100vw; max-width: 100vw; }
}
`;
