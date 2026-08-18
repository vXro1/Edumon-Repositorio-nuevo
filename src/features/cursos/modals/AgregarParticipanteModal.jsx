// src/features/cursos/pages/AgregarParticipanteModal.refactor.jsx
import { useState } from 'react';
import { Modal, Button, Input, Toast } from '@/components';
import { cursosAddParticipante } from '@/features/cursos/services/cursosService';
import { normalizePhone } from '@/utils/normalizePhone';
import { humanizeError } from '@/utils/humanizeError';

const EMPTY_FORM = { nombre: '', apellido: '', cedula: '', telefono: '' };

export default function AgregarParticipanteModal({ open, onClose, onAdded, cursoId }) {
  const [form, setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState({ msg: '', type: 'success' });

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose && onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombre    = form.nombre.trim();
    const apellido  = form.apellido.trim();
    const cedula    = form.cedula.trim();
    const telefono  = form.telefono.trim();

    if (!nombre || !apellido || !cedula || !telefono) {
      notify('Todos los campos son requeridos', 'error');
      return;
    }
    if (!cursoId) {
      notify('No se especificó el curso', 'error');
      return;
    }

    setSaving(true);
    try {
      // No se envía "contraseña": el backend la define como la cédula por defecto.
      // Nunca se manda un valor distinto (ni prefijos como "EDU") para garantizar
      // que la contraseña inicial del participante sea siempre su cédula.
      await cursosAddParticipante(cursoId, {
        nombre,
        apellido,
        cedula,
        telefono: normalizePhone(telefono) || telefono,
      });
      notify('Participante agregado');
      setForm(EMPTY_FORM);
      onAdded && onAdded();
      handleClose();
    } catch (err) {
      notify(humanizeError(err, 'Error al agregar participante'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toast {...toast} />
      <Modal isOpen={!!open} onClose={handleClose} title="Agregar participante" size="md">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            placeholder="Nombre *"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          />
          <Input
            placeholder="Apellido *"
            value={form.apellido}
            onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
          />
          <Input
            placeholder="Cédula *"
            value={form.cedula}
            onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))}
          />
          <Input
            placeholder="Teléfono *"
            value={form.telefono}
            onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
          />
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 4px' }}>
            Si el padre no existe, se creará con contraseña igual a su cédula.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" type="button" onClick={handleClose}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Agregando...' : 'Agregar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}