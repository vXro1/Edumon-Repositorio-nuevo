// src/features/foros/components/ForumInput.jsx
// Message composer: reply context, auto-resize textarea, file attach, send.
import { useRef, useState } from 'react';
import { Send, Paperclip, X, Lock, FileText } from 'lucide-react';
import { Button } from '@/components';

const MAX_FILES = 5;

const FilePill = ({ file, onRemove }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
    borderRadius: 20, padding: '3px 10px', fontSize: 12,
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
  const textareaRef       = useRef(null);

  const isClosed = foro?.estado === 'cerrado' || foro?.cerrado;
  const canSend  = !isClosed && !loading && (text.trim().length > 0 || files.length > 0);

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Auto-resize
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
    }
  };

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
      text.trim() || '(Archivo adjunto)',
      files,
      replyTo?._id ?? null,
    );
    setText('');
    setFiles([]);
    onClearReply?.();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
      {/* Reply-to context strip */}
      {replyTo && (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          background:     'rgba(140,56,240,0.06)',
          border:         '1px solid rgba(140,56,240,0.18)',
          borderLeft:     '3px solid var(--color-primary)',
          borderRadius:   8,
          padding:        '6px 12px',
          marginBottom:   10,
          fontSize:       12.5,
        }}>
          <span style={{ color: 'var(--color-text-muted)' }}>
            ↩ Respondiendo a{' '}
            <strong style={{ color: 'var(--color-text)' }}>
              {replyTo.autor?.nombre} {replyTo.autor?.apellido}
            </strong>
            {replyTo.contenido && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>
                — {replyTo.contenido.slice(0, 60)}{replyTo.contenido.length > 60 ? '…' : ''}
              </span>
            )}
          </span>
          <Button variant="ghost" size="sm" type="button" onClick={onClearReply}
            style={{ padding: '2px 4px', marginLeft: 8 }}>
            <X size={13} />
          </Button>
        </div>
      )}

      {/* File pills */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {files.map((f, i) => <FilePill key={i} file={f} onRemove={removeFile} />)}
        </div>
      )}

      {/* Input row */}
      <div style={{
        display:      'flex',
        gap:          8,
        alignItems:   'flex-end',
        background:   'var(--color-surface-2, #f3f4f6)',
        border:       '1.5px solid var(--color-border)',
        borderRadius: 12,
        padding:      '8px 8px 8px 14px',
        transition:   'border-color 0.15s',
      }}
        onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
        onBlurCapture={e  => e.currentTarget.style.borderColor = 'var(--color-border)'}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
          rows={1}
          style={{
            flex:       1,
            resize:     'none',
            border:     'none',
            background: 'transparent',
            fontSize:   14,
            lineHeight: 1.55,
            fontFamily: 'inherit',
            outline:    'none',
            minWidth:   0,
            padding:    0,
            maxHeight:  180,
            overflowY:  'auto',
            color:      'var(--color-text)',
          }}
        />

        {/* Attach file */}
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= MAX_FILES}
          title="Adjuntar archivo"
          style={{ flexShrink: 0, padding: '4px 6px' }}
        >
          <Paperclip size={17} />
        </Button>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }}
          multiple accept="image/*,video/mp4,.pdf"
          onChange={handleFileChange} />

        {/* Send button */}
        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          loading={loading}
          leftIcon={!loading ? <Send size={14} /> : undefined}
          style={{ flexShrink: 0 }}
        >
          {!loading && 'Enviar'}
        </Button>
      </div>

      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
        Shift+Enter para nueva línea · Máx {MAX_FILES} archivos por mensaje
      </p>
    </div>
  );
};

export default ForumInput;
