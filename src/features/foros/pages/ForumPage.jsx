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

// El backend (foroRoutes.js) acepta hasta 5 archivos de máx. 10MB cada uno:
// imágenes, video (mp4/mpeg/quicktime) y PDF.
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

  // Visibilidad de los paneles — AMBOS arrancan cerrados, también en
  // escritorio. Antes se abrían solos en pantallas anchas y el usuario
  // aterrizaba en 3 columnas compitiendo por su atención (lista de foros +
  // mensajes + estadísticas) antes de siquiera leer el foro — abrumador
  // para alguien que solo quiere leer/escribir un mensaje. Ahora la vista
  // inicial es SIEMPRE solo el foro; los paneles son opcionales y se abren
  // a pedido con los botones con texto del header ("Otros foros" /
  // "Estadísticas").
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);

  // Al navegar a otro foro, cerrar los paneles (evita quedar con un overlay
  // abierto tapando el foro nuevo en pantallas angostas).
  useEffect(() => {
    setSidebarOpen(false);
    setActivityOpen(false);
  }, [foroId]);

  // Solo un panel a la vez en pantallas angostas (uno tapa al otro como
  // overlay); en escritorio ambos pueden estar abiertos como columnas.
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
          {/* Sidebar izquierdo — columna fija (sticky) en escritorio; sección
              normal del documento en pantallas angostas, nunca un overlay
              flotante encima del contenido. */}
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

          {/* Panel de actividad — misma lógica que el sidebar: columna fija
              en escritorio, sección normal (no overlay) en angosto. */}
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
//
// Rediseño (v2): el problema reportado no era el layout de 3 columnas en sí
// (eso ya se había arreglado antes — ver historial), sino que el ENCABEZADO
// era una barra sticky con su propio fondo/borde/sombra, una segunda barra
// flotando justo debajo de la navbar real de la app, dentro del padding de
// `.page` — el foro se sentía como una app aparte pegada al dashboard, no
// como una pantalla más de Edumon. Además `.fm-body` reimplementaba su
// propio max-width + padding cuando `.page` (el contenedor real de toda
// página del dashboard) ya hace exactamente eso — el resultado era relleno
// duplicado entre la navbar y el contenido real.
//
// Ahora: no hay ninguna barra sticky. El encabezado es una tarjeta más,
// con el mismo lenguaje visual (borde, radio, sombra) que las columnas de
// abajo — pertenece a la misma familia visual en vez de destacarse como
// "chrome" de aplicación. `.fm-body` ya no fija su propio ancho/relleno:
// hereda el de `.page`, igual que cualquier otra página del dashboard.
const FORUM_CSS = `
@keyframes fm-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes fm-spin   { to { transform: rotate(360deg); } }

.fm-root {
  display:        flex;
  flex-direction: column;
}

/* ── Volver — mismo botón de texto simple que el resto de la app (ver
   CursoHubPage.jsx: <Button variant="ghost"><ArrowLeft/> Volver</Button>) ── */
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

/* ── Encabezado — tarjeta normal, misma familia visual que las columnas
   de abajo (border + radius + clay-card), NUNCA sticky ni con su propio
   fondo de "barra". ── */
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

/* Envoltorio: separa la descripción del título con más aire (antes 6px —
   se sentía pegada) y, si es larga, la colapsa con un degradado para no
   dejar que un texto extenso empuje mensajes/estadísticas fuera de vista. */
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

/* Texto de lectura pensado para adultos mayores: fuente más grande,
   interlineado generoso y buen contraste (antes todo — incluidas las
   negritas — iba en gris muted, sin jerarquía visual). */
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

/* ── Cuerpo: flex en vez de grid con columnas fijas — con los paneles
   cerrados por defecto (ver ForumPage), un grid de 3 pistas fijas habría
   dejado dos huecos vacíos a los lados en vez de dejar que los mensajes
   ocupen todo el ancho. Con flex, un panel oculto (display:none) simplemente
   desaparece y .fm-main se expande solo. Hereda ancho/relleno de .page. */
.fm-body {
  display:      flex;
  align-items:  flex-start;
  gap:          16px;
  width:        100%;
}

/* ── Barra lateral — sticky, no flotante ──
   min-height: sin esto, con poco contenido (un foro, un mensaje) las tres
   columnas quedaban cortas y el resto de la página se veía como un vacío
   gris sin terminar, con los bordes inferiores de las columnas en
   escalera (la de actividad mucho más alta que las otras dos) — el efecto
   "a medio cargar" que se reportó. Un piso común de altura hace que las
   tres columnas compongan una sola fila pareja, como cualquier layout de
   3 columnas real, sin importar cuánto contenido tenga cada una todavía. */
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

/* ── Centro principal — fluye con la página, sin recorte propio ── */
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

/* flex:1 empuja el compositor (ForumInput) al fondo de la tarjeta cuando
   hay pocos mensajes, en vez de dejarlo pegado justo debajo del último
   mensaje con un vacío suelto entre el compositor y el borde de la tarjeta. */
.fm-messages-scroll {
  flex:    1;
  padding: 14px 18px 10px;
}

/* ── Panel de actividad — sticky, no flotante ── */
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

/* ── Compacto: tableta y móvil, <1100px ──
   Sidebar y actividad dejan de ser columnas: pasan a ser SECCIONES del
   documento (la página sigue desplazándose normalmente), controladas por
   el mismo botón con texto del header — nunca un overlay que tape el
   contenido. */
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
    /* En columna, flex-basis controla ALTO, no ancho — sin resetear esto
       el panel quedaría forzado a una altura mínima de 240/280px al
       apilarse, aunque tenga poco contenido. */
    flex:       none;
  }
  /* El piso de altura de escritorio (pensado para que 3 columnas compongan
     una fila pareja) no aplica apiladas en una sola columna — ahí solo
     dejaría un hueco vacío enorme dentro de cada sección. */
  .fm-main {
    min-height: 0;
  }
}

/* ── Móvil < 768 ──
   El texto de los botones NUNCA se oculta (antes .fm-action-label pasaba a
   display:none acá, dejando botones solo-ícono sin significado claro para
   alguien que no reconoce el ícono — .fm-header-actions ya envuelve en
   varias filas si no caben, así que ocultar el texto no hacía falta). */
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
