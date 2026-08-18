// src/features/cursos/hooks/useCursoTareas.js
import { useState, useEffect } from 'react';
import { tareasGetAll } from '@/features/cursos/services/tareasService';
import { normalizeTarea } from '@/lib/normalizers';

export default function useCursoTareas(cursoId) {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await tareasGetAll({ cursoId, limit: 500 });
        if (!mounted) return;
        setTareas((res.tareas ?? []).map(normalizeTarea));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [cursoId]);

  return { tareas, loading };
}
