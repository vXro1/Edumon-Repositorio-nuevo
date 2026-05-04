// src/features/cursos/pages/AgregarParticipanteModal.refactor.jsx
import React, { useState } from 'react';
import { Modal, Button, Input } from '@/components';
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
        <Input placeholder="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
        <Input placeholder="Apellido" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
        <Input placeholder="Cédula" value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} />
        <Input placeholder="Teléfono" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Agregando...' : 'Agregar'}</Button>
        </div>
      </form>
    </Modal>
  );
}