// Vista canónica del foro — todos los roles usan esta misma página
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
import { Modal, Button, RichTextEditor } from '@/components';
import { forosCreate } from '@/features/foros/services/forosService';
import { Field } from '../../cursos/components/shared/ui';
import { humanizeError } from '@/utils/humanizeError';
import { sanitizeRichText, stripHtml } from '@/utils/richText';

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

// el backend acepta hasta 5 archivos de máx. 10MB: imágenes, video, PDF
const MaterialPill = ({ file, onRemove }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'var(--color-surface-2, #f3f4f6)', border: '1px solid var(--color-border)',
    borderRadius: 20, padding: '3px 10px', fontSize: 12,
    boxShadow: 'var(--clay-pill)',
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

  const descripcionTexto = stripHtml(descripcion);

  const handleSubmit = async () => {
    if (titulo.trim().length < 5)      { setError('El título debe tener al menos 5 caracteres.'); return; }
    if (descripcionTexto.length < 10)  { setError('La descripción debe tener al menos 10 caracteres.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('titulo', titulo.trim());
      fd.append('descripcion', sanitizeRichText(descripcion));
      fd.append('cursoId', cursoId);
      fd.append('publico', 'false');
      materiales.forEach(f => fd.append('archivos', f));
      await forosCreate(fd);
      notify('Foro creado correctamente', 'success');
      onCreated?.();
      onClose();
    } catch (err) {
      setError(humanizeError(err, 'No pudimos crear el foro. Intenta nuevamente.'));
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
        <RichTextEditor
          value={descripcion}
          onChange={setDescripcion}
          minHeight={100}
          placeholder="Describe de qué trata el foro (mínimo 10 caracteres)"
        />
        <span style={{ fontSize: 11, color: descripcionTexto.length < 10 ? 'var(--color-error-hover)' : 'var(--color-text-muted)' }}>
          {descripcionTexto.length} / 2000
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
          disabled={loading || titulo.trim().length < 5 || descripcionTexto.length < 10}>
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

  // por debajo de 1100px no cabe el layout de 3 columnas; los paneles pasan a overlays
  const [isCompact, setIsCompact] = useState(() => window.innerWidth < 1100);
  useEffect(() => {
    const fn = () => setIsCompact(window.innerWidth < 1100);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // ambos paneles arrancan cerrados — la vista inicial es solo el foro, se abren a pedido
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);

  // cerrar los paneles al cambiar de foro (evita overlay tapando el foro nuevo en angosto)
  useEffect(() => {
    setSidebarOpen(false);
    setActivityOpen(false);
  }, [foroId]);

  // en angosto solo un panel a la vez (overlay); en escritorio ambos pueden estar abiertos
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
      onError: (err) => notify(
        humanizeError(err, 'No pudimos publicar tu mensaje. Comprueba tu conexión e intenta nuevamente.'),
        'error'
      ),
    });
  };

  const handleLike = (msgId) => {
    likeMutation.mutate(msgId, {
      onError: (err) => notify(humanizeError(err, 'No pudimos guardar tu "Me gusta". Intenta de nuevo.'), 'error'),
    });
  };

  const handleDelete = (msgId) => {
    deleteMutation.mutate(msgId, {
      onSuccess: () => notify('Mensaje eliminado', 'info'),
      onError:   (err) => notify(humanizeError(err, 'No pudimos eliminar el mensaje. Intenta de nuevo.'), 'error'),
    });
  };

  const handleEdit = ({ id, contenido }) => {
    editMutation.mutate({ id, contenido }, {
      onSuccess: () => notify('Mensaje actualizado', 'success'),
      onError:   (err) => notify(humanizeError(err, 'No pudimos guardar los cambios. Intenta de nuevo.'), 'error'),
    });
  };

  const handleToggleEstado = () => {
    const nuevoEstado = foro?.estado === 'cerrado' ? 'abierto' : 'cerrado';
    estadoMutation.mutate({ estado: nuevoEstado }, {
      onSuccess: () => notify(`Foro ${nuevoEstado}`, 'success'),
      onError:   (err) => notify(humanizeError(err, 'No pudimos cambiar el estado del foro. Intenta de nuevo.'), 'error'),
    });
  };

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
          {/* sticky en escritorio; sección normal (no overlay) en angosto */}
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
                        canReply={perms.canPostMessage && perms.canReplyToMessage(msg.autor?.rol)}
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

          {/* misma lógica que el sidebar */}
          <div className={`fm-activity${activityOpen ? ' open' : ''}`}>
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
// El encabezado es una tarjeta normal (mismo lenguaje visual que las columnas
// de abajo), no una barra sticky. .fm-body hereda ancho/padding de .page.
const FORUM_CSS = `
@keyframes fm-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes fm-spin   { to { transform: rotate(360deg); } }

.fm-root {
  display:        flex;
  flex-direction: column;
}

/* mismo botón de texto simple que el resto de la app */
.fm-back {
  display:      flex;
  align-items:  center;
  gap:          6px;
  background:   none;
  border:       none;
  cursor:       pointer;
  padding:      6px 4px;
  margin-bottom: 12px;
  border-radius: 6px;
  color:        var(--color-text-muted);
  font-size:    13px;
  font-weight:  600;
  transition:   color 0.15s;
}
.fm-back:hover { color: var(--color-text); }

/* tarjeta normal, nunca sticky */
.fm-header {
  display:        flex;
  align-items:    flex-start;
  justify-content: space-between;
  flex-wrap:      wrap;
  gap:            16px;
  background:     var(--color-surface);
  border:         1px solid var(--color-border);
  border-radius:  16px;
  box-shadow:     var(--clay-card, 0 1px 3px rgba(0,0,0,0.06));
  padding:        20px 22px;
  margin-bottom:  16px;
}

.fm-header-icon {
  width:          44px;
  height:         44px;
  border-radius:  12px;
  flex-shrink:    0;
  display:        flex;
  align-items:    center;
  justify-content: center;
  background:     var(--edu-pink-50, rgba(242,61,127,0.10));
  color:          var(--edu-pink-600, #D42B68);
}
.fm-header-icon[data-closed] {
  background: var(--color-error-light, rgba(220,38,38,0.10));
  color:      var(--color-error-hover);
}

.fm-eyebrow {
  margin:         0 0 3px;
  font-size:      11.5px;
  font-weight:    700;
  letter-spacing: 0.04em;
  color:          var(--color-text-muted);
  overflow:       hidden;
  text-overflow:  ellipsis;
  white-space:    nowrap;
}

.fm-title {
  margin:         0;
  font-size:      clamp(1.05rem, 2.4vw, 1.35rem);
  font-weight:    800;
  color:          var(--color-text);
  font-family:    var(--font-display);
  letter-spacing: -0.02em;
  overflow-wrap:  anywhere;
}

.fm-status {
  flex-shrink:    0;
  font-size:      10.5px;
  font-weight:    700;
  padding:        3px 9px;
  border-radius:  9999px;
  background:     var(--color-success-light);
  color:          var(--edu-green-700, #15803d);
}
.fm-status[data-closed] {
  background: var(--color-error-light);
  color:      var(--color-error-hover);
}

/* descripción larga se colapsa con degradado para no empujar el resto fuera de vista */
.fm-desc-wrap {
  position:  relative;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
.fm-desc-wrap.is-collapsed {
  max-height: 5.4em;
  overflow:   hidden;
}
.fm-desc-wrap.is-collapsed::after {
  content:    '';
  position:   absolute;
  left: 0; right: 0; bottom: 0;
  height:     2.4em;
  background: linear-gradient(to bottom, transparent, var(--color-surface));
  pointer-events: none;
}

.fm-desc-toggle {
  display:      inline-flex;
  align-items:  center;
  gap:          4px;
  margin-top:   8px;
  background:   none;
  border:       none;
  padding:      2px 0;
  font-size:    13.5px;
  font-weight:  700;
  color:        var(--color-primary);
  cursor:       pointer;
}
.fm-desc-toggle:hover { text-decoration: underline; }

/* fuente grande e interlineado generoso — pensado para lectores adultos mayores */
.fm-desc {
  margin:    0;
  font-size: 14.5px;
  color:     var(--color-text-muted);
  line-height: 1.75;
  max-width: 70ch;
}
.fm-desc p { margin: 0 0 12px; }
.fm-desc p:last-child { margin-bottom: 0; }
.fm-desc ul, .fm-desc ol { margin: 8px 0 12px 26px; padding: 0; }
.fm-desc li { margin-bottom: 6px; }
.fm-desc strong, .fm-desc b { color: var(--color-text); font-weight: 800; }

.fm-msg-content p { margin: 0 0 8px; }
.fm-msg-content p:last-child { margin-bottom: 0; }
.fm-msg-content ul, .fm-msg-content ol { margin: 6px 0 8px 24px; padding: 0; }
.fm-msg-content li { margin-bottom: 4px; }

.fm-count {
  display:      flex;
  align-items:  center;
  gap:          5px;
  margin:       8px 0 0;
  font-size:    12px;
  font-weight:  600;
  color:        var(--color-text-muted);
}

.fm-header-actions {
  display:      flex;
  align-items:  center;
  gap:          8px;
  flex-wrap:    wrap;
  flex-shrink:  0;
}

.fm-action {
  display:      flex;
  align-items:  center;
  gap:          7px;
  background:   var(--color-bg);
  border:       1.5px solid var(--color-border);
  border-radius: 9px;
  padding:      9px 14px;
  cursor:       pointer;
  color:        var(--color-text-muted);
  font-size:    13.5px;
  font-weight:  700;
  transition:   background 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s;
}
.fm-action:hover { color: var(--color-text); border-color: var(--color-text-muted); }
.fm-action[data-active] {
  background:   rgba(12,106,196,0.08);
  border-color: rgba(12,106,196,0.3);
  color:        var(--color-primary);
}
.fm-action[data-variant="close"] { background: var(--color-error-light); border-color: transparent; color: var(--color-error-hover); }
.fm-action[data-variant="open"]  { background: var(--color-success-light); border-color: transparent; color: var(--edu-green-700, #15803d); }
.fm-action:disabled { opacity: 0.6; cursor: default; }

/* flex en vez de grid: un panel oculto (display:none) desaparece y .fm-main se expande solo */
.fm-body {
  display:      flex;
  align-items:  flex-start;
  gap:          16px;
  width:        100%;
}

/* sticky, no flotante — min-height evita que las 3 columnas queden en escalera con poco contenido */
.fm-sidebar {
  flex:         0 0 240px;
  width:        240px;
  border:       1px solid var(--color-border);
  border-radius: 14px;
  background:   var(--color-surface);
  box-shadow:   var(--clay-card, 0 1px 3px rgba(0,0,0,0.06));
  position:     sticky;
  top:          16px;
  min-height:   clamp(320px, calc(100vh - 260px), 640px);
  max-height:   calc(100vh - 32px);
  overflow-y:   auto;
}
.fm-sidebar:not(.open) { display: none; }

.fm-main {
  display:        flex;
  flex-direction: column;
  flex:           1 1 auto;
  min-width:      0;
  min-height:     clamp(320px, calc(100vh - 260px), 640px);
  background:     var(--color-surface);
  border:         1px solid var(--color-border);
  border-radius:  14px;
  box-shadow:     var(--clay-card, 0 1px 3px rgba(0,0,0,0.06));
  overflow:       hidden;
}

/* flex:1 empuja el compositor al fondo de la tarjeta cuando hay pocos mensajes */
.fm-messages-scroll {
  flex:    1;
  padding: 14px 18px 10px;
}

.fm-activity {
  flex:          0 0 280px;
  width:         280px;
  border:        1px solid var(--color-border);
  border-radius: 14px;
  background:    var(--color-surface);
  box-shadow:    var(--clay-card, 0 1px 3px rgba(0,0,0,0.06));
  position:      sticky;
  top:           16px;
  min-height:    clamp(320px, calc(100vh - 260px), 640px);
  max-height:    calc(100vh - 32px);
  overflow-y:    auto;
}
.fm-activity:not(.open) { display: none; }

/* tableta y móvil: sidebar/actividad pasan de columnas a secciones apiladas */
@media (max-width: 1100px) {
  .fm-body {
    display: flex;
    flex-direction: column;
  }
  .fm-sidebar, .fm-activity {
    position:   static;
    max-height: none;
    min-height: 0;
    width:      100%;
    flex:       none; /* en columna, flex-basis controla alto, no ancho */
  }
  .fm-main {
    min-height: 0;
  }
}

/* el texto de los botones nunca se oculta, aunque no haya espacio */
@media (max-width: 767px) {
  .fm-messages-scroll {
    padding: 10px 12px 4px;
  }
  .fm-header {
    padding: 16px;
  }
  .fm-action { padding: 8px 12px; font-size: 13px; }
}
`;
