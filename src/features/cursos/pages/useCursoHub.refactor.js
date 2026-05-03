// src/features/cursos/pages/useCursoHub.refactor.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { cursosGetById, modulosGetByCurso, tareasGetAll, forosGetByCurso, cursosGetParticipantes } from '@/lib/apiClient';
import { normalizeCurso, normalizeTarea, normalizeUser } from '@/lib/normalizers';
import useUserStore from '@/store/useUserStore';
import { humanizeError } from '@/utils/humanizeError';

const DEFAULT_TABS = ['overview','modules','tasks','foros','participants','entregas'];

export default function useCursoHub(cursoId) {
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  const [visibleTabs] = useState(DEFAULT_TABS);
  const [data, setData] = useState({ modulos: [], tareas: [], foros: [], participantes: [], entregas: [] });
  const loaded = useRef(new Set());
  const [modals, setModals] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await cursosGetById(cursoId);
        const c = normalizeCurso(res.curso ?? res);
        setCurso(c);
        if (c.docente) useUserStore.getState().setUser(c.docente);
      } catch (err) {
        setError(humanizeError(err, 'No se pudo cargar el curso'));
      } finally { setLoading(false); }
    })();
  }, [cursoId]);

  const loadTab = useCallback(async (tabKey) => {
    if (!curso) return;
    if (loaded.current.has(tabKey)) return;
    loaded.current.add(tabKey);
    try {
      if (tabKey === 'modules') {
        const m = await modulosGetByCurso(cursoId);
        setData(d => ({ ...d, modulos: m.modulos ?? m ?? [] }));
        const t = await tareasGetAll({ cursoId, limit: 500 });
        setData(d => ({ ...d, tareas: (t.tareas ?? []).map(normalizeTarea) }));
      } else if (tabKey === 'tasks') {
        const t = await tareasGetAll({ cursoId, limit: 500 });
        setData(d => ({ ...d, tareas: (t.tareas ?? []).map(normalizeTarea) }));
      } else if (tabKey === 'foros') {
        const f = await forosGetByCurso(cursoId);
        setData(d => ({ ...d, foros: f.foros ?? f ?? [] }));
      } else if (tabKey === 'participants') {
        const p = await cursosGetParticipantes(cursoId, { limit: 500 });
        const norm = (p.participantes ?? p.users ?? []).map(x => ({ usuario: normalizeUser(x.usuario ?? x) }));
        setData(d => ({ ...d, participantes: norm }));
        useUserStore.getState().setUsers(norm.map(p => p.usuario));
      }
    } catch (err) { console.error(err); }
  }, [curso, cursoId]);

  const reloadCourse = useCallback(() => {
    loaded.current.clear();
    setData({ modulos: [], tareas: [], foros: [], participantes: [], entregas: [] });
    (async () => {
      try {
        const res = await cursosGetById(cursoId);
        setCurso(normalizeCurso(res.curso ?? res));
      } catch (err) { console.error(err); }
    })();
  }, [cursoId]);

  const showModal = (key, payload = {}) => setModals(m => ({ ...m, [key]: { open: true, payload } }));
  const hideModal = (key) => setModals(m => ({ ...m, [key]: { open: false, payload: null } }));

  return { curso, loading, error, tab, setTab, visibleTabs, data, loadTab, reloadCourse, modals, showModal, hideModal };
}
