// src/features/cursos/pages/EditCursoModal.refactor.jsx
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Modal, Button, Input } from '@/components';
import { cursosUpdate } from '@/features/cursos/services/cursosService';
import { humanizeError } from '@/utils/humanizeError';

// Paleta curada — todos hex válidos para el regex del backend (#3B82F6 etc.)
const COLOR_PALETTE = [
  { value: '#3B82F6', name: 'Azul' },
  { value: '#8B5CF6', name: 'Violeta' },
  { value: '#EC4899', name: 'Rosa' },
  { value: 'var(--color-error)', name: 'Rojo' },
  { value: '#F97316', name: 'Naranja' },
  { value: '#F59E0B', name: 'Ámbar' },
  { value: '#10B981', name: 'Esmeralda' },
  { value: '#14B8A6', name: 'Teal' },
  { value: '#06B6D4', name: 'Cian' },
  { value: '#6366F1', name: 'Índigo' },
];

function ColorSwatch({ color, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(color.value)}
      title={color.name}
      aria-label={color.name}
      aria-pressed={selected}
      style={{
        width: 28,
        height: 28,
        minWidth: 28,
        borderRadius: '50%',
        border: selected ? '2px solid #fff' : '2px solid transparent',
        outline: selected ? `2px solid ${color.value}` : 'none',
        outlineOffset: 2,
        background: color.value,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        flexShrink: 0,
        transition: 'transform 120ms ease',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {selected && <Check style={{ width: 14, height: 14, color: '#fff' }} strokeWidth={3} />}
    </button>
  );
}

export default function EditCursoModal({ open, curso, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: curso?.nombre || '',
    descripcion: curso?.descripcion || '',
    color: curso?.color || COLOR_PALETTE[0].value,
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm({
      nombre: curso?.nombre || '',
      descripcion: curso?.descripcion || '',
      color: curso?.color || COLOR_PALETTE[0].value,
    });
  }, [curso]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nombre', form.nombre);
      fd.append('descripcion', form.descripcion);
      fd.append('color', form.color);
      await cursosUpdate(curso._id, fd);
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      alert(humanizeError(err, 'Error al actualizar curso'));
    } finally {
      setSaving(false);
    }
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

        <div>
          <span style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
            Color del curso
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {COLOR_PALETTE.map((c) => (
              <ColorSwatch
                key={c.value}
                color={c}
                selected={form.color === c.value}
                onSelect={(value) => setForm(f => ({ ...f, color: value }))}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}