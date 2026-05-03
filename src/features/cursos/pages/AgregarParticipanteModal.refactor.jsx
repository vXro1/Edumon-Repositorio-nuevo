// src/features/cursos/pages/AgregarParticipanteModal.refactor.jsx
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { cursosAddParticipante } from '@/lib/apiClient';
import { normalizePhone } from '@/utils/normalizePhone';
import { humanizeError } from '@/utils/humanizeError';

export default function AgregarParticipanteModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', cedula: '', telefono: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cursosAddParticipante(form.cursoId || '', { ...form, telefono: normalizePhone(form.telefono) || form.telefono });
      onAdded && onAdded();
      onClose && onClose();
    } catch (err) {
      alert(humanizeError(err, 'Error al agregar participante'));
    } finally { setSaving(false); }
  };

  return (
    <Modal open={!!open} onClose={onClose} title="Agregar participante">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
        <input placeholder="Apellido" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
        <input placeholder="Cédula" value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} />
        <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ background: '#0C6AC4', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>{saving ? 'Agregando...' : 'Agregar'}</button>
        </div>
      </form>
    </Modal>
  );
}
