// src/features/cursos/pages/EditCursoModal.refactor.jsx
import React, { useState } from 'react';
import { Modal, Button, Input } from '@/components';
import { cursosUpdate } from '@/lib/apiClient';
import { humanizeError } from '@/utils/humanizeError';

export default function EditCursoModal({ open, curso, onClose, onSaved }) {
  const [form, setForm] = useState({ nombre: curso?.nombre || '', descripcion: curso?.descripcion || '' });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { setForm({ nombre: curso?.nombre || '', descripcion: curso?.descripcion || '' }); }, [curso]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nombre', form.nombre);
      fd.append('descripcion', form.descripcion);
      await cursosUpdate(curso._id, fd);
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      alert(humanizeError(err, 'Error al actualizar curso'));
    } finally { setSaving(false); }
  };

  return (
    <Modal open={!!open} onClose={onClose} title="Editar curso">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          Nombre
          <Input 
            value={form.nombre} 
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} 
          />
        </label>
        <label>
          Descripción
          <textarea 
            value={form.descripcion} 
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} 
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