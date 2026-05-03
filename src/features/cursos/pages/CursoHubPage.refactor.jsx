// src/features/cursos/pages/CursoHubPage.refactor.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import CursoHeader from './CursoHeader.refactor.jsx';
import CursoTabs from './CursoTabs.refactor.jsx';
import CursoOverviewTab from './CursoOverviewTab.refactor.jsx';
import CursoModulosTab from './CursoModulosTab.refactor.jsx';
import CursoTareasTab from './CursoTareasTab.refactor.jsx';
import CursoForosTab from './CursoForosTab.refactor.jsx';
import CursoParticipantesTab from './CursoParticipantesTab.refactor.jsx';
import CursoEntregasTab from './CursoEntregasTab.refactor.jsx';
import EditCursoModal from './EditCursoModal.refactor.jsx';
import CalificarEntregaModal from './CalificarEntregaModal.refactor.jsx';
import AgregarParticipanteModal from './AgregarParticipanteModal.refactor.jsx';
import useCursoHub from './useCursoHub.refactor.js';

export default function CursoHubPageRefactor() {
  const { id } = useParams();
  const {
    curso, loading, error,
    tab, setTab, visibleTabs,
    data, loadTab, reloadCourse,
    modals, showModal, hideModal,
  } = useCursoHub(id);

  if (loading) return <div style={{ padding: 40 }}>Cargando curso...</div>;
  if (error) return <div style={{ padding: 40 }}>{error}</div>;
  if (!curso) return <div style={{ padding: 40 }}>Curso no encontrado</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <CursoHeader curso={curso} onEdit={() => showModal('editCurso')} />
      <CursoTabs tabs={visibleTabs} active={tab} onChange={k => { setTab(k); loadTab(k); }} />

      <div style={{ padding: '24px 0' }}>
        {tab === 'overview' && <CursoOverviewTab curso={curso} />}
        {tab === 'modules' && <CursoModulosTab curso={curso} data={data.modulos} reload={reloadCourse} />}
        {tab === 'tasks' && <CursoTareasTab curso={curso} data={data.tareas} />}
        {tab === 'foros' && <CursoForosTab data={data.foros} />}
        {tab === 'participants' && <CursoParticipantesTab data={data.participantes} onAdd={() => showModal('agregarParticipante')} />}
        {tab === 'entregas' && <CursoEntregasTab data={data.entregas} onGrade={(entrega) => showModal('calificarEntrega', { entrega })} />}
      </div>

      <EditCursoModal open={!!modals.editCurso?.open} curso={curso} onClose={() => hideModal('editCurso')} onSaved={reloadCourse} />
      <AgregarParticipanteModal open={!!modals.agregarParticipante?.open} onClose={() => hideModal('agregarParticipante')} onAdded={reloadCourse} />
      <CalificarEntregaModal open={!!modals.calificarEntrega?.open} entrega={modals.calificarEntrega?.payload?.entrega} onClose={() => hideModal('calificarEntrega')} />
    </div>
  );
}
