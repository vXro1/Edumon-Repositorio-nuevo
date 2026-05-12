// src/features/cursos/components/foros/ForosTab.jsx
// Forum tab inside CursoHubPage.
// Clicking a forum navigates to the canonical ForumPage (/curso/:cursoId/foro/:foroId).
// The modal-detail approach has been removed — forums open as full pages.
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Lock, Plus, ArrowRight } from 'lucide-react';
import { forosGetByCurso, forosCreate } from '@/lib/apiClient';
import { Button, Modal, FileUpload, Toast } from '@/components';
import { Sk, SectionHeader, Field, StTextarea } from '../shared/ui';
import { makeNotify } from '../shared/helpers';
import { Input } from '@/components';

// ─── ForoCrearForm ────────────────────────────────────────────────────────────

function ForoCrearForm({ onSubmit, onCancel }) {
  const [titulo,      setTitulo]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivos,    setArchivos]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleSubmit = async () => {
    setError('');
    if (titulo.trim().length < 5)       { setError('El título debe tener al menos 5 caracteres.'); return; }
    if (descripcion.trim().length < 10) { setError('La descripción debe tener al menos 10 caracteres.'); return; }
    setLoading(true);
    try {
      await onSubmit({ titulo: titulo.trim(), descripcion: descripcion.trim(), archivos });
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
          padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
          {error}
        </div>
      )}
      <Field label="Título *">
        <Input value={titulo} onChange={e => setTitulo(e.target.value)}
          placeholder="Mínimo 5 caracteres" maxLength={200} />
        <span style={{ fontSize: 11, color: titulo.length < 5 ? '#dc2626' : 'var(--color-text-muted)' }}>
          {titulo.length} / 200
        </span>
      </Field>
      <Field label="Descripción *">
        <StTextarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
          placeholder="Describe de qué trata el foro (mínimo 10 caracteres)" rows={4}
          maxLength={2000} />
        <span style={{ fontSize: 11, color: descripcion.length < 10 ? '#dc2626' : 'var(--color-text-muted)' }}>
          {descripcion.length} / 2000
        </span>
      </Field>
      <Field label="Archivos adjuntos (opcional)">
        <FileUpload files={archivos} onChange={setArchivos}
          accept="image/*,video/mp4,.pdf" maxFiles={5}
          label="Arrastra o haz clic para adjuntar (imagen, video o PDF)" />
      </Field>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end',
        paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit}
          disabled={loading || titulo.trim().length < 5 || descripcion.trim().length < 10}>
          {loading ? 'Creando…' : 'Crear foro'}
        </Button>
      </div>
    </div>
  );
}

// ─── ForoCard ─────────────────────────────────────────────────────────────────

function ForoCard({ foro, cursoId, cursoNombre }) {
  const navigate  = useNavigate();
  const isClosed  = foro.estado === 'cerrado';
  const [hov, setHov] = useState(false);

  const goToForum = () => navigate(
    `/curso/${cursoId}/foro/${foro._id}`,
    { state: { cursoNombre } },
  );

  return (
    <div
      onClick={goToForum}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:      '14px 16px',
        borderRadius: 12,
        border:       `1.5px solid ${hov ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background:   'var(--color-surface)',
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        cursor:       'pointer',
        transition:   'border-color 0.15s, box-shadow 0.15s',
        boxShadow:    hov ? '0 4px 16px rgba(140,56,240,0.08)' : 'none',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: isClosed ? 'var(--color-surface-2)' : 'rgba(140,56,240,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isClosed ? 'var(--color-text-muted)' : 'var(--color-primary)',
      }}>
        {isClosed ? <Lock size={16} /> : <MessageSquare size={16} />}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <p style={{ fontWeight: 700, margin: 0, fontSize: 14, color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {foro.titulo}
          </p>
          {isClosed && (
            <span style={{ fontSize: 10, background: '#fee2e2', color: '#dc2626',
              padding: '2px 7px', borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>
              Cerrado
            </span>
          )}
        </div>
        {foro.descripcion && (
          <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {foro.descripcion}
          </p>
        )}
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '3px 0 0' }}>
          {foro.totalMensajes ?? 0} mensajes
        </p>
      </div>

      {/* Arrow */}
      <ArrowRight size={16} style={{
        color: hov ? 'var(--color-primary)' : 'var(--color-border)',
        transition: 'color 0.15s', flexShrink: 0,
      }} />
    </div>
  );
}

// ─── ForosTab ─────────────────────────────────────────────────────────────────

export default function ForosTab({ cursoId, cursoNombre, canCreate = false }) {
  const [foros,     setForos]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showCrear, setShowCrear] = useState(false);
  const [toast,     setToast]     = useState({ msg: '', type: 'success' });
  const notify = makeNotify(setToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forosGetByCurso(cursoId);
      setForos(res.foros ?? (Array.isArray(res) ? res : []));
    } catch {
      setForos([]);
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  const handleCrear = async ({ titulo, descripcion, archivos }) => {
    const fd = new FormData();
    fd.append('titulo', titulo);
    fd.append('descripcion', descripcion);
    fd.append('cursoId', cursoId);
    fd.append('publico', 'false');
    archivos.forEach(f => fd.append('archivos', f));
    await forosCreate(fd);
    setShowCrear(false);
    notify('Foro creado');
    load();
  };

  return (
    <div>
      <Toast {...toast} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 14 }}>
        <SectionHeader title="Foros" />
        {canCreate && (
          <Button size="sm" onClick={() => setShowCrear(true)}>
            <Plus size={14} style={{ marginRight: 4 }} />
            Nuevo foro
          </Button>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={showCrear} onClose={() => setShowCrear(false)}
        title="Crear nuevo foro" size="md">
        <ForoCrearForm
          onSubmit={handleCrear}
          onCancel={() => setShowCrear(false)}
        />
      </Modal>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(i => <Sk key={i} h={80} r={12} />)}
        </div>
      ) : foros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <MessageSquare size={32} style={{ color: 'var(--color-border)', margin: '0 auto 10px' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, margin: 0 }}>
            No hay foros disponibles en este curso.
          </p>
          {canCreate && (
            <button type="button" onClick={() => setShowCrear(true)}
              style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-primary)', fontSize: 13.5, fontWeight: 600,
                textDecoration: 'underline' }}>
              Crear el primer foro
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {foros.map(f => (
            <ForoCard key={f._id} foro={f} cursoId={cursoId} cursoNombre={cursoNombre} />
          ))}
        </div>
      )}
    </div>
  );
}
