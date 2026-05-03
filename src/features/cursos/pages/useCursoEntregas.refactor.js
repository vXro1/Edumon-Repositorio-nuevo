// src/features/cursos/pages/useCursoEntregas.refactor.js
import { useState } from 'react';
import { entregasGetByTarea } from '@/lib/apiClient';
import { normalizeEntrega } from '@/lib/normalizers';

export default function useCursoEntregas() {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadForTarea = async (tareaId) => {
    setLoading(true);
    try {
      const res = await entregasGetByTarea(tareaId);
      setEntregas((res.entregas ?? []).map(normalizeEntrega));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return { entregas, loading, loadForTarea };
}
