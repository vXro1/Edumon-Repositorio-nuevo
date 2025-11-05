'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Home, 
  Users, 
  BookOpen, 
  ClipboardList,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Trash2,
  Edit,
  FileText,
  UserPlus,
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  MessageCircle,
  FileCheck,
  Download,
  Eye,
  X,
  ExternalLink,
  File
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-edumon.onrender.com';

const InformacionCursoPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursoId = searchParams.get('cursoId');

  const [curso, setCurso] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState('general');
  const [filtroTareas, setFiltroTareas] = useState('todas');
  const [modalTarea, setModalTarea] = useState(null);
  const [entregasPorTarea, setEntregasPorTarea] = useState({});

  useEffect(() => {
    if (!cursoId) {
      alert('No se especificó un curso');
      router.push('/profesor');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    cargarDatos();
  }, [cursoId, router]);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    
    try {
      setLoading(true);

      // Cargar curso
      const cursoRes = await fetch(`${API_BASE_URL}/cursos/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!cursoRes.ok) {
        throw new Error('No se pudo cargar la información del curso');
      }

      const cursoData = await cursoRes.json();
      const cursoCompleto = cursoData.curso || cursoData;
      setCurso(cursoCompleto);
      setParticipantes(cursoCompleto.participantes || []);

      // Cargar módulos
      const modulosRes = await fetch(`${API_BASE_URL}/modulos?cursoId=${cursoId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (modulosRes.ok) {
        const modulosData = await modulosRes.json();
        setModulos(modulosData.modulos || []);
      }

      // Cargar tareas
      const tareasRes = await fetch(`${API_BASE_URL}/tareas?cursoId=${cursoId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (tareasRes.ok) {
        const tareasData = await tareasRes.json();
        const tareasArray = tareasData.tareas || tareasData || [];
        setTareas(tareasArray);
        
        // Cargar cantidad de entregas por tarea
        const entregasCount = {};
        for (const tarea of tareasArray) {
          try {
            const entregasRes = await fetch(`${API_BASE_URL}/entregas/tarea/${tarea._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (entregasRes.ok) {
              const entregasData = await entregasRes.json();
              entregasCount[tarea._id] = entregasData.total || entregasData.entregas?.length || 0;
            }
          } catch (err) {
            console.error(`Error cargando entregas para tarea ${tarea._id}:`, err);
            entregasCount[tarea._id] = 0;
          }
        }
        setEntregasPorTarea(entregasCount);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/1200x400?text=Sin+Imagen';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const getRolBadgeColor = (rol) => {
    switch (rol?.toLowerCase()) {
      case 'docente':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'padre':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'administrador':
        return 'bg-red-100 text-red-700 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getEstadoTareaBadge = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'abierta':
      case 'publicada':
        return { color: 'bg-green-100 text-green-700 border border-green-200', icon: CheckCircle, texto: 'Abierta' };
      case 'cerrada':
        return { color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: XCircle, texto: 'Cerrada' };
      case 'pendiente':
        return { color: 'bg-yellow-100 text-yellow-700 border border-yellow-200', icon: Clock, texto: 'Pendiente' };
      default:
        return { color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: AlertCircle, texto: estado };
    }
  };

  const calcularDiasRestantes = (fechaLimite) => {
    if (!fechaLimite) return null;
    const hoy = new Date();
    const limite = new Date(fechaLimite);
    const diferencia = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  const getTareasFiltradas = () => {
    let tareasFiltradas = [...tareas];

    switch (filtroTareas) {
      case 'abiertas':
        tareasFiltradas = tareasFiltradas.filter(t => 
          t.estado === 'abierta' || t.estado === 'publicada'
        );
        break;
      case 'cerradas':
        tareasFiltradas = tareasFiltradas.filter(t => t.estado === 'cerrada');
        break;
      case 'proximas':
        tareasFiltradas = tareasFiltradas
          .filter(t => (t.estado === 'abierta' || t.estado === 'publicada') && t.fechaLimite)
          .sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite));
        break;
      default:
        break;
    }

    return tareasFiltradas;
  };

  const handleEliminarParticipante = async (participanteId) => {
    if (!confirm('¿Estás seguro de eliminar este participante del curso?')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/cursos/${cursoId}/participantes/${participanteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al eliminar participante');

      alert('Participante eliminado correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  const navegarA = (ruta) => {
    if (ruta.includes('?')) {
      router.push(ruta);
    } else {
      router.push(`${ruta}?cursoId=${cursoId}`);
    }
  };

  const abrirModalTarea = (tarea) => {
    setModalTarea(tarea);
  };

  const cerrarModalTarea = () => {
    setModalTarea(null);
  };

  const descargarArchivo = (url, nombre) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const verEntregas = (tareaId) => {
    router.push(`/profesor/cursos/crear/modulos/tareas/entregas?cursoId=${cursoId}&tareaId=${tareaId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-gray-700 font-medium">Cargando información del curso...</p>
          <p className="text-gray-500 text-sm mt-1">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  const tareasFiltradas = getTareasFiltradas();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-all hover:scale-105"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
                <span className="font-semibold text-sm">Volver</span>
              </button>
              <div className="h-6 w-px bg-gradient-to-b from-indigo-200 to-purple-200"></div>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="text-indigo-600" size={20} />
                <h1 className="text-lg font-bold text-gray-800">Información del Curso</h1>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => router.push('/profesor')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
              >
                <Home size={16} />
                <span className="hidden sm:inline">Inicio</span>
              </button>
              <button
                onClick={() => navegarA('/profesor/cursos/crear/registropadres')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 text-green-700 rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Registrar Padres</span>
              </button>
              <button
                onClick={() => navegarA('/profesor/cursos/crear/modulos')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
              >
                <BookOpen size={16} />
                <span className="hidden sm:inline">Módulos</span>
              </button>
              <button
                onClick={() => navegarA('/profesor/cursos/crear/modulos/tareas')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
              >
                <ClipboardList size={16} />
                <span className="hidden sm:inline">Crear Tarea</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de secciones */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setSeccionActiva('general')}
              className={`px-5 py-3 font-semibold text-sm whitespace-nowrap border-b-3 transition-all ${
                seccionActiva === 'general'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Información General
            </button>
            <button
              onClick={() => setSeccionActiva('participantes')}
              className={`px-5 py-3 font-semibold text-sm whitespace-nowrap border-b-3 transition-all ${
                seccionActiva === 'participantes'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Participantes ({participantes.length})
            </button>
            <button
              onClick={() => setSeccionActiva('tareas')}
              className={`px-5 py-3 font-semibold text-sm whitespace-nowrap border-b-3 transition-all ${
                seccionActiva === 'tareas'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Tareas ({tareas.length})
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* SECCIÓN: INFORMACIÓN GENERAL */}
        {seccionActiva === 'general' && (
          <div className="space-y-6">
            {/* Banner del curso */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="relative h-64">
                <img
                  src={getImageUrl(curso?.fotoPortadaUrl)}
                  alt={curso?.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/1200x400?text=Sin+Imagen';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <GraduationCap size={32} />
                    <h2 className="text-4xl font-bold drop-shadow-lg">{curso?.nombre}</h2>
                  </div>
                  <p className="text-white/95 text-lg drop-shadow-md max-w-3xl">{curso?.descripcion}</p>
                </div>
              </div>
            </div>

            {/* Detalles del curso */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="text-indigo-600" size={24} />
                <h3 className="text-xl font-bold text-gray-800">Detalles del Curso</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-gray-500 text-sm font-medium">Docente responsable</p>
                  <p className="font-semibold text-gray-800 text-lg">
                    {curso?.docenteId?.nombre} {curso?.docenteId?.apellido}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500 text-sm font-medium">Correo del docente</p>
                  <p className="font-medium text-gray-700">{curso?.docenteId?.correo}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500 text-sm font-medium">Fecha de creación</p>
                  <p className="font-medium text-gray-700">
                    {new Date(curso?.fechaCreacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500 text-sm font-medium">ID del curso</p>
                  <p className="font-mono text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    {curso?._id}
                  </p>
                </div>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <LayoutDashboard className="text-indigo-600" size={24} />
                <h3 className="text-xl font-bold text-gray-800">Accesos Rápidos</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => navegarA('/profesor/cursos/informacion/calendario')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border border-blue-200 transition-all group"
                >
                  <CalendarDays className="text-blue-600 group-hover:scale-110 transition-transform" size={24} />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Calendario</p>
                    <p className="text-xs text-gray-600">Ver eventos y fechas</p>
                  </div>
                </button>
                
                <button
                  onClick={() => navegarA('/profesor/cursos/informacion/foro')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg border border-purple-200 transition-all group"
                >
                  <MessageCircle className="text-purple-600 group-hover:scale-110 transition-transform" size={24} />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Foro</p>
                    <p className="text-xs text-gray-600">Discusiones del curso</p>
                  </div>
                </button>

                <button
                  onClick={() => navegarA('/profesor/cursos/crear/modulos/tareas/revisar')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-lg border border-green-200 transition-all group"
                >
                  <FileCheck className="text-green-600 group-hover:scale-110 transition-transform" size={24} />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Revisar Tareas</p>
                    <p className="text-xs text-gray-600">Calificar entregas</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN: PARTICIPANTES */}
        {seccionActiva === 'participantes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-indigo-600" size={28} />
                <h3 className="text-2xl font-bold text-gray-800">
                  Participantes del Curso
                </h3>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {participantes.length}
                </span>
              </div>
            </div>

            {participantes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-16 text-center">
                <Users className="mx-auto text-gray-300 mb-6" size={64} />
                <p className="text-gray-600 text-lg font-medium mb-2">No hay participantes registrados</p>
                <p className="text-gray-500 text-sm mb-6">Comienza agregando participantes al curso</p>
                <button
                  onClick={() => navegarA('/profesor/cursos/crear/registropadres')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <UserPlus size={20} />
                  Registrar Participantes
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {participantes.map((participante) => (
                  <div
                    key={participante._id}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-all hover:border-indigo-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-4 rounded-full">
                          <User className="text-indigo-600" size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-lg">
                            {participante.usuarioId?.nombre || 'Sin nombre'}{' '}
                            {participante.usuarioId?.apellido || ''}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            {participante.usuarioId?.correo || 'Sin correo'}
                          </p>
                          {participante.usuarioId?.telefono && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              {participante.usuarioId.telefono}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-4 py-2 rounded-full text-xs font-semibold ${getRolBadgeColor(
                            participante.etiqueta || participante.usuarioId?.rol
                          )}`}
                        >
                          {participante.etiqueta || participante.usuarioId?.rol || 'Sin rol'}
                        </span>
                        {participante.etiqueta !== 'docente' && (
                          <button
                            onClick={() => handleEliminarParticipante(participante.usuarioId?._id || participante.usuarioId)}
                            className="p-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all hover:scale-105"
                            title="Eliminar participante"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN: TAREAS */}
        {seccionActiva === 'tareas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="text-indigo-600" size={28} />
                <h3 className="text-2xl font-bold text-gray-800">
                  Tareas del Curso
                </h3>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {tareas.length}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFiltroTareas('todas')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                    filtroTareas === 'todas'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFiltroTareas('abiertas')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                    filtroTareas === 'abiertas'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Abiertas
                </button>
                <button
                  onClick={() => setFiltroTareas('cerradas')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                    filtroTareas === 'cerradas'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Cerradas
                </button>
                <button
                  onClick={() => setFiltroTareas('proximas')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                    filtroTareas === 'proximas'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Próximas
                </button>
              </div>
            </div>

            {tareasFiltradas.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-16 text-center">
                <ClipboardList className="mx-auto text-gray-300 mb-6" size={64} />
                <p className="text-gray-600 text-lg font-medium mb-2">
                  {filtroTareas === 'todas'
                    ? 'No hay tareas creadas'
                    : `No hay tareas ${filtroTareas}`}
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Crea tareas para que los participantes puedan trabajar
                </p>
                <button
                  onClick={() => navegarA('/profesor/cursos/crear/modulos/tareas')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow
                  -md hover:shadow-lg font-medium"
                >
                  <Plus size={20} />
                  Crear Nueva Tarea
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {tareasFiltradas.map((tarea) => {
                  const estadoBadge = getEstadoTareaBadge(tarea.estado);
                  const diasRestantes = calcularDiasRestantes(tarea.fechaLimite);
                  const IconoEstado = estadoBadge.icon;
                  const cantidadEntregas = entregasPorTarea[tarea._id] || 0;

                  return (
                    <div
                      key={tarea._id}
                      className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-indigo-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-xl font-bold text-gray-800">{tarea.titulo}</h4>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${estadoBadge.color}`}>
                              <IconoEstado size={14} />
                              {estadoBadge.texto}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4 leading-relaxed">{tarea.descripcion}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            {tarea.fechaLimite && (
                              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                <Calendar className="text-gray-500" size={16} />
                                <span className="text-gray-700 font-medium">
                                  {new Date(tarea.fechaLimite).toLocaleDateString('es-ES')}
                                </span>
                                {diasRestantes !== null && tarea.estado !== 'cerrada' && (
                                  <span className={`ml-1 font-semibold ${
                                    diasRestantes < 0
                                      ? 'text-red-600'
                                      : diasRestantes <= 3
                                      ? 'text-amber-600'
                                      : 'text-green-600'
                                  }`}>
                                    {diasRestantes < 0
                                      ? `(Vencida)`
                                      : diasRestantes === 0
                                      ? '(Hoy)'
                                      : `(${diasRestantes}d)`}
                                  </span>
                                )}
                              </div>
                            )}
                            {tarea.moduloId && (
                              <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                                <BookOpen className="text-purple-600" size={16} />
                                <span className="text-purple-700 font-medium">
                                  {tarea.moduloId.titulo || 'Sin título'}
                                </span>
                              </div>
                            )}
                            {tarea.tipoEntrega && (
                              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                                <FileText className="text-blue-600" size={16} />
                                <span className="text-blue-700 font-medium capitalize">
                                  {tarea.tipoEntrega}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                              <FileCheck className="text-amber-600" size={16} />
                              <span className="text-amber-700 font-medium">
                                {cantidadEntregas} {cantidadEntregas === 1 ? 'Entrega' : 'Entregas'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => abrirModalTarea(tarea)}
                            className="p-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-all hover:scale-105"
                            title="Ver detalles"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => router.push(`/profesor/cursos/crear/modulos/tareas?cursoId=${cursoId}&tareaId=${tarea._id}`)}
                            className="p-2.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all hover:scale-105"
                            title="Editar tarea"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Tarea */}
      {modalTarea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <ClipboardList size={28} />
                    <h2 className="text-2xl font-bold">{modalTarea.titulo}</h2>
                  </div>
                  <p className="text-white/90">{modalTarea.descripcion}</p>
                </div>
                <button
                  onClick={cerrarModalTarea}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información Principal */}
              <div className="grid md:grid-cols-2 gap-4">
                {modalTarea.fechaLimite && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium mb-1">Fecha límite</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-indigo-600" size={18} />
                      <p className="text-gray-800 font-semibold">
                        {new Date(modalTarea.fechaLimite).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {modalTarea.estado && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium mb-1">Estado</p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const badge = getEstadoTareaBadge(modalTarea.estado);
                        const IconoEstado = badge.icon;
                        return (
                          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 ${badge.color}`}>
                            <IconoEstado size={16} />
                            {badge.texto}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {modalTarea.tipoEntrega && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium mb-1">Tipo de entrega</p>
                    <p className="text-gray-800 font-semibold capitalize">{modalTarea.tipoEntrega}</p>
                  </div>
                )}

                {modalTarea.moduloId && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium mb-1">Módulo</p>
                    <div className="flex items-center gap-2">
                      <BookOpen className="text-purple-600" size={18} />
                      <p className="text-gray-800 font-semibold">{modalTarea.moduloId.titulo || 'Sin título'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Asignación */}
              {modalTarea.asignacionTipo && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-700 font-semibold mb-2">Tipo de asignación</p>
                  <p className="text-gray-700">
                    {modalTarea.asignacionTipo === 'todos' 
                      ? 'Asignada a todos los participantes del curso' 
                      : `Asignada a ${modalTarea.participantesSeleccionados?.length || 0} participantes específicos`}
                  </p>
                </div>
              )}

              {/* Archivos Adjuntos */}
              {modalTarea.archivosAdjuntos && modalTarea.archivosAdjuntos.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <File size={20} className="text-indigo-600" />
                    Archivos Adjuntos ({modalTarea.archivosAdjuntos.length})
                  </h3>
                  <div className="space-y-2">
                    {modalTarea.archivosAdjuntos.map((archivo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {archivo.tipo === 'enlace' ? (
                            <ExternalLink className="text-blue-600" size={20} />
                          ) : (
                            <File className="text-gray-600" size={20} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{archivo.nombre}</p>
                            {archivo.tipo === 'archivo' && archivo.formato && (
                              <p className="text-xs text-gray-500 uppercase">{archivo.formato}</p>
                            )}
                            {archivo.descripcion && (
                              <p className="text-sm text-gray-600">{archivo.descripcion}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => descargarArchivo(archivo.url, archivo.nombre)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-all font-medium text-sm"
                        >
                          <Download size={16} />
                          {archivo.tipo === 'enlace' ? 'Abrir' : 'Descargar'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Ver Entregas */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => verEntregas(modalTarea._id)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  <FileCheck size={20} />
                  Ver Entregas ({entregasPorTarea[modalTarea._id] || 0})
                </button>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="bg-gray-50 p-4 rounded-b-2xl border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={cerrarModalTarea}
                className="px-6 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg transition-all font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  cerrarModalTarea();
                  router.push(`/profesor/cursos/crear/modulos/tareas?cursoId=${cursoId}&tareaId=${modalTarea._id}`);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Edit size={16} />
                Editar Tarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InformacionCursoPage;