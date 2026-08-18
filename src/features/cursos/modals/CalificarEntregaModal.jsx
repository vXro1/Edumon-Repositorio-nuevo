// src/features/cursos/pages/CalificarEntregaModal.refactor.jsx
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal, Button } from '@/components';
import { entregasCalificar } from '@/features/entregas/services/entregasService';
import { humanizeError } from '@/utils/humanizeError';

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
            aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          >
            <Star style={{
              width: 30, height: 30,
              fill: filled ? '#F59E0B' : 'none',
              color: filled ? '#F59E0B' : '#D1D5DB',
              transition: 'all 120ms',
            }} />
          </button>
        );
      })}
      {value > 0 && (
        <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 4 }}>{value} de 5</span>
      )}
    </div>
  );
}

export default function CalificarEntregaModal({ open, entrega, onClose, onSaved }) {
  const [valoracion, setValoracion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    const v = entrega?.calificacion?.valoracion ?? 0;
    setValoracion((v >= 1 && v <= 5) ? v : 0);
    setComentario(entrega?.calificacion?.comentario ?? '');
  }, [entrega]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entrega) return;
    if (!valoracion) { alert('Selecciona una valoración de 1 a 5 estrellas'); return; }
    setSaving(true);
    try {
      await entregasCalificar(entrega._id, { valoracion, comentario });
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      alert(humanizeError(err, 'Error al calificar'));
    } finally { setSaving(false); }
  };

  return (
    <Modal open={!!open} onClose={onClose} title={entrega ? `Calificar: ${entrega.usuario?.nombre || 'Estudiante'}` : 'Calificar entrega'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Valoración (1-5 estrellas) *
          </p>
          <StarPicker value={valoracion} onChange={setValoracion} />
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Comentario
          </p>
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            style={{
              width: '100%', minHeight: 100, padding: '8px 12px',
              borderRadius: 8, border: '1px solid var(--color-border)',
              fontFamily: 'inherit', fontSize: 14, resize: 'vertical',
              background: 'var(--color-bg)', color: 'var(--color-text)',
              boxSizing: 'border-box',
            }}
            placeholder="Retroalimentación al estudiante…"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}
