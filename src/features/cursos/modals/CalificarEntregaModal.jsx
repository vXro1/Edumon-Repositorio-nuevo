// src/features/cursos/pages/CalificarEntregaModal.refactor.jsx
import React, { useState } from 'react';
import { Modal, Button, Input } from '@/components';
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
        <label>
          Nota
          <Input 
            value={nota} 
            onChange={e => setNota(e.target.value)} 
            type="number" 
            min="0" 
            max="10" 
            step="0.1"
          />
        </label>
        <label>
          Comentario
          <textarea 
            value={comentario} 
            onChange={e => setComentario(e.target.value)} 
            style={{
              width: '100%',
              minHeight: 100,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              fontFamily: 'inherit',
              fontSize: 14,
            }}
          />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  );
}