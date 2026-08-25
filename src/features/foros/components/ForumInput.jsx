// src/features/foros/components/ForumInput.jsx
// Compositor de mensajes: contexto de respuesta, editor de texto enriquecido, adjuntar archivos y enviar.
import { useRef, useState } from 'react';
import { Send, Paperclip, X, Lock, FileText } from 'lucide-react';
import { Button, RichTextEditor } from '@/components';
import { sanitizeRichText, stripHtml } from '@/utils/richText';

const MAX_FILES = 5;

const FilePill = ({ file, onRemove }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
    borderRadius: 20, padding: '3px 10px', fontSize: 12,
    boxShadow: 'var(--clay-pill)',
  }}>
    <FileText size={11} style={{ flexShrink: 0 }} />
    <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {file.name}
    </span>
    <button onClick={() => onRemove(file)} type="button"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        color: 'var(--color-text-muted)', display: 'flex', lineHeight: 1 }}>
      <X size={11} />
    </button>
  </div>
);

const ForumInput = ({
  foro,
  replyTo,
  onClearReply,
  onSubmit,
  loading = false,
}) => {
  const [text, setText]   = useState('');
  const [files, setFiles] = useState([]);
  const fileInputRef      = useRef(null);

  const isClosed  = foro?.estado === 'cerrado' || foro?.cerrado;
  const textPlano = stripHtml(text);
  const canSend   = !isClosed && !loading && (textPlano.length > 0 || files.length > 0);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles(prev => {
      const combined = [...prev, ...picked];
      return combined.slice(0, MAX_FILES);
    });
    e.target.value = '';
  };

  const removeFile = (file) => setFiles(prev => prev.filter(f => f !== file));

  const handleSend = () => {
    if (!canSend) return;
    onSubmit?.(
      textPlano.length > 0 ? sanitizeRichText(text) : '(Archivo adjunto)',
      files,
      replyTo?._id ?? null,
    );
    setText('');
    setFiles([]);
    onClearReply?.();
  };

  if (isClosed) {
    return (
      <div style={{
        borderTop:  '1px solid var(--color-border)',
        padding:    '14px 20px',
        background: 'var(--color-surface)',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: 'var(--color-text-muted)',
        fontSize: 13.5,
      }}>
        <Lock size={14} />
        Este foro está cerrado para nuevas participaciones.
      </div>
    );
  }

  return (
    <div style={{
      borderTop:  '1px solid var(--color-border)',
      padding:    '12px 16px 16px',
      background: 'var(--color-surface)',
    }}>
      {/* Banda de contexto de respuesta */}
      {replyTo && (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          background:     'rgba(12,106,196,0.06)',
          border:         '1px solid rgba(12,106,196,0.18)',
          borderLeft:     '3px solid var(--color-primary)',
          borderRadius:   8,
          padding:        '6px 12px',
          marginBottom:   10,
          fontSize:       12.5,
        }}>
          <span style={{ color: 'var(--color-text-muted)', flex: 1, minWidth: 0, overflowWrap: 'break-word' }}>
            ↩ Respondiendo a{' '}
            <strong style={{ color: 'var(--color-text)' }}>
              {replyTo.autor?.nombre} {replyTo.autor?.apellido}
            </strong>
            {replyTo.contenido && (() => {
              const preview = stripHtml(replyTo.contenido);
              return preview && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>
                  — {preview.slice(0, 60)}{preview.length > 60 ? '…' : ''}
                </span>
              );
            })()}
          </span>
          <Button variant="ghost" size="sm" type="button" onClick={onClearReply}
            style={{ padding: '2px 4px', marginLeft: 8, flexShrink: 0 }}>
            <X size={13} />
          </Button>
        </div>
      )}

      {/* Etiqueta clara — sin esto, la única pista de qué es esta caja era
          el placeholder, que desaparece apenas el usuario empieza a
          escribir (nada de texto plano que sostenga esa explicación). */}
      <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
        Escribe tu mensaje
      </p>

      <RichTextEditor
        value={text}
        onChange={setText}
        onKeyDown={handleKeyDown}
        placeholder="Escribe aquí lo que quieras compartir…"
        minHeight={52}
        maxHeight={200}
        compact
      />

      {/* Pastillas de archivos */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {files.map((f, i) => <FilePill key={i} file={f} onRemove={removeFile} />)}
        </div>
      )}

      {/* Fila de acciones — en su propia fila DEBAJO del editor, con texto
          visible en ambos botones (antes "Adjuntar" era un ícono suelto
          sin ninguna palabra al lado, y "Enviar" quedaba apretado junto al
          editor en una sola línea comprimida). */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
        <Button
          variant="ghost"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= MAX_FILES}
          leftIcon={<Paperclip size={16} />}
        >
          Adjuntar archivo
        </Button>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }}
          multiple accept="image/*,video/mp4,.pdf"
          onChange={handleFileChange} />

        <Button
          variant="primary"
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          loading={loading}
          leftIcon={!loading ? <Send size={15} /> : undefined}
          style={{ flexShrink: 0 }}
        >
          {!loading && 'Enviar mensaje'}
        </Button>
      </div>

      <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--color-text-muted)' }}>
        Puedes presionar Enter para enviar · Máximo {MAX_FILES} archivos por mensaje
      </p>
    </div>
  );
};

export default ForumInput;
