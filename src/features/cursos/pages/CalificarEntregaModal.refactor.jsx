// src/features/cursos/pages/CalificarEntregaModal.refactor.jsx
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { entregasCalificar } from '@/lib/apiClient';
import { humanizeError } from '@/utils/humanizeError';

export default function CalificarEntregaModal({ open, entrega, onClose, onSaved }) {
  const [nota, setNota] = useState('');
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { setNota(''); setComentario(''); }, [entrega]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entrega) return;
    setSaving(true);
    try {
      await entregasCalificar(entrega._id, { nota: parseFloat(nota), comentario });
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      alert(humanizeError(err, 'Error al calificar'));
    } finally { setSaving(false); }
  };

  return (
    <Modal open={!!open} onClose={onClose} title={entrega ? `Calificar: ${entrega.usuario?.nombre || 'Desconocido'}` : 'Calificar entrega'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>Nota<input value={nota} onChange={e => setNota(e.target.value)} type="number" min="0" max="10" step="0.1"/></label>
        <label>Comentario<textarea value={comentario} onChange={e => setComentario(e.target.value)} /></label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ background: '#16A34A', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}
