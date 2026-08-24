// src/features/cursos/pages/AgregarParticipanteModal.refactor.jsx
import { useState } from 'react';
import { Modal, Button, Input, Toast, PhoneInput } from '@/components';
import { cursosAddParticipante } from '@/features/cursos/services/cursosService';
import { normalizePhone, isValidPhone, PHONE_ERROR } from '@/utils/normalizePhone';
import {
  contrasenaInicial, TEXTO_CONTRASENA_INICIAL,
  isValidCedula, CEDULA_ERROR, toCedula,
} from '@/utils/credenciales';
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
    if (!isValidCedula(cedula))  { notify(CEDULA_ERROR, 'error'); return; }
    if (!isValidPhone(telefono)) { notify(PHONE_ERROR, 'error'); return; }

    setSaving(true);
    try {
      // No se envía "contraseña": el backend aplica la regla única del sistema
      // (contraseña inicial = cédula). Nunca se manda un valor distinto ni un
      // prefijo propio, para que ningún flujo de creación pueda divergir.
      await cursosAddParticipante(cursoId, {
        nombre,
        apellido,
        cedula,
        telefono: normalizePhone(telefono),
      });
      notify(`Participante agregado. Contraseña inicial: ${contrasenaInicial(cedula)}`);
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
            inputMode="numeric"
            value={form.cedula}
            onChange={e => setForm(f => ({ ...f, cedula: toCedula(e.target.value) }))}
          />
          <PhoneInput
            label={null}
            hint={null}
            value={form.telefono}
            onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
          />
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 4px' }}>
            Si el padre no existe, se creará automáticamente. {TEXTO_CONTRASENA_INICIAL}
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