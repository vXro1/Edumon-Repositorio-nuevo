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
  File,
  Phone,
  Mail,
  Badge,
  School
} from 'lucide-react';

// Importar el componente de Loading
import LoadingScreen from '@/components/LoadingScreen'; // Ajusta la ruta según tu estructura

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
  const [loading, setLoading] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState('general');
  const [filtroTareas, setFiltroTareas] = useState('todas');
  const [modalTarea, setModalTarea] = useState(null);
  const [entregasPorTarea, setEntregasPorTarea] = useState({});
  const [modalParticipante, setModalParticipante] = useState(null);
  const [participanteAEliminar, setParticipanteAEliminar] = useState(null);

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

      // Cargar curso con participantes
      const cursoRes = await fetch(`${API_BASE_URL}/cursos/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!cursoRes.ok) {
        throw new Error('No se pudo cargar la información del curso');
      }

      const cursoData = await cursoRes.json();
      const cursoCompleto = cursoData.curso || cursoData;
      setCurso(cursoCompleto);

      // Log para debugging
      console.log('📚 Curso completo:', cursoCompleto);
      console.log('👥 Participantes raw:', cursoCompleto.participantes);

      // ALTERNATIVA: Usar el endpoint específico de participantes que sí trae las fotos
      try {
        const participantesRes = await fetch(`${API_BASE_URL}/cursos/${cursoId}/participantes`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (participantesRes.ok) {
          const participantesData = await participantesRes.json();
          console.log('👥 Participantes desde endpoint específico:', participantesData);

          // El endpoint devuelve un array formateado con fotoPerfilUrl
          const participantesFormateados = participantesData.participantes || participantesData;

          // Mapear al formato que espera el componente
          const participantesMapeados = participantesFormateados.map(p => ({
            _id: p._id,
            etiqueta: p.etiqueta,
            usuarioId: {
              _id: p._id,
              nombre: p.nombre,
              apellido: p.apellido,
              correo: p.correo,
              telefono: p.telefono,
              rol: p.rol,
              estado: p.estado,
              fotoPerfilUrl: p.fotoPerfilUrl
            }
          }));

          console.log('✅ Participantes mapeados con fotos:', participantesMapeados);
          setParticipantes(participantesMapeados);
        } else {
          // Fallback al método anterior si el endpoint no funciona
          console.warn('⚠️ No se pudo obtener participantes del endpoint específico, usando datos del curso');
          const participantesConFotos = (cursoCompleto.participantes || []).map(p => ({
            ...p,
            usuarioId: {
              ...p.usuarioId,
              fotoPerfilUrl: p.usuarioId?.fotoPerfilUrl || null
            }
          }));
          setParticipantes(participantesConFotos);
        }
      } catch (error) {
        console.error('❌ Error cargando participantes:', error);
        // Fallback
        const participantesConFotos = (cursoCompleto.participantes || []).map(p => ({
          ...p,
          usuarioId: {
            ...p.usuarioId,
            fotoPerfilUrl: p.usuarioId?.fotoPerfilUrl || null
          }
        }));
        setParticipantes(participantesConFotos);
      }

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
      console.error('❌ Error cargando datos:', error);
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

  const getAvatarUrl = (url) => {
    if (!url) return null;

    // Log para debugging
    console.log('🖼️ Avatar URL recibida:', url);

    // Si ya es una URL completa de Cloudinary o externa
    if (url.startsWith('http')) {
      console.log('✅ URL completa detectada:', url);
      return url;
    }

    // Si es una ruta relativa, agregar el BACKEND_URL
    const fullUrl = `${BACKEND_URL}${url}`;
    console.log('🔗 URL construida:', fullUrl);
    return fullUrl;
  };

  const getRolBadgeColor = (rol) => {
    switch (rol?.toLowerCase()) {
      case 'docente':
        return 'bg-[#FE327B]/10 text-[#FE327B] border border-[#FE327B]/20';
      case 'padre':
        return 'bg-[#7AD107]/10 text-[#7AD107] border border-[#7AD107]/20';
      case 'administrador':
        return 'bg-[#FA6D00]/10 text-[#FA6D00] border border-[#FA6D00]/20';
      default:
        return 'bg-[#E2E8F0] text-[#718096] border border-[#E2E8F0]';
    }
  };

  const getEstadoTareaBadge = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'abierta':
      case 'publicada':
        return { color: 'bg-[#7AD107]/10 text-[#7AD107] border border-[#7AD107]/20', icon: CheckCircle, texto: 'Abierta' };
      case 'cerrada':
        return { color: 'bg-[#718096]/10 text-[#718096] border border-[#718096]/20', icon: XCircle, texto: 'Cerrada' };
      case 'pendiente':
        return { color: 'bg-[#FED31F]/10 text-[#FA6D00] border border-[#FED31F]/20', icon: Clock, texto: 'Pendiente' };
      default:
        return { color: 'bg-[#E2E8F0] text-[#718096] border border-[#E2E8F0]', icon: AlertCircle, texto: estado };
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
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/cursos/${cursoId}/participantes/${participanteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al eliminar participante');

      alert('Participante eliminado correctamente');
      setParticipanteAEliminar(null);
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
    return <LoadingScreen mensaje="Cargando información del curso..." />;
  }

  const tareasFiltradas = getTareasFiltradas();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[#718096] hover:text-[#00B9F0] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#00B9F0] flex items-center justify-center text-white hover:bg-[#01C9F4] transition-colors">
                  <ArrowLeft size={18} />
                </div>
                <span className="font-semibold text-sm hidden sm:inline">Volver</span>
              </button>
              <div className="h-6 w-px bg-[#E2E8F0]"></div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                  <LayoutDashboard size={18} />
                </div>
                <h1 className="text-base sm:text-lg font-bold text-[#2D3748]">Información del Curso</h1>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => router.push('/profesor')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#E2E8F0] hover:bg-[#718096] text-[#2D3748] hover:text-white rounded-lg transition-all text-sm font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Home size={16} />
                </div>
                <span className="hidden sm:inline">Inicio</span>
              </button>
              <button
                onClick={() => navegarA('/profesor/cursos/crear/registropadres')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white rounded-lg transition-all text-sm font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <span className="hidden sm:inline">Registrar</span>
              </button>
              <button
                onClick={() => navegarA('/profesor/cursos/crear/modulos')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all text-sm font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <span className="hidden sm:inline">Módulos</span>
              </button>
              <button
                onClick={() => navegarA('/profesor/cursos/crear/modulos/tareas')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#FE327B] hover:bg-[#FE327B]/90 text-white rounded-lg transition-all text-sm font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <ClipboardList size={16} />
                </div>
                <span className="hidden sm:inline">Crear Tarea</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de secciones */}
      <div className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSeccionActiva('general')}
              className={`px-4 sm:px-6 py-3 font-semibold text-sm whitespace-nowrap border-b-3 transition-all ${seccionActiva === 'general'
                  ? 'border-[#00B9F0] text-[#00B9F0] bg-[#00B9F0]/5'
                  : 'border-transparent text-[#718096] hover:text-[#2D3748] hover:bg-[#F7FAFC]'
                }`}
            >
              Información General
            </button>
            <button
              onClick={() => setSeccionActiva('participantes')}
              className={`px-4 sm:px-6 py-3 font-semibold text-sm whitespace-nowrap border-b-3 transition-all ${seccionActiva === 'participantes'
                  ? 'border-[#00B9F0] text-[#00B9F0] bg-[#00B9F0]/5'
                  : 'border-transparent text-[#718096] hover:text-[#2D3748] hover:bg-[#F7FAFC]'
                }`}
            >
              Participantes ({participantes.length})
            </button>
            <button
              onClick={() => setSeccionActiva('tareas')}
              className={`px-4 sm:px-6 py-3 font-semibold text-sm whitespace-nowrap border-b-3 transition-all ${seccionActiva === 'tareas'
                  ? 'border-[#00B9F0] text-[#00B9F0] bg-[#00B9F0]/5'
                  : 'border-transparent text-[#718096] hover:text-[#2D3748] hover:bg-[#F7FAFC]'
                }`}
            >
              Tareas ({tareas.length})
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* SECCIÓN: INFORMACIÓN GENERAL */}
        {seccionActiva === 'general' && (
          <div className="space-y-6">
            {/* Banner del curso */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#E2E8F0]">
              <div className="relative h-48 sm:h-64">
                <img
                  src={getImageUrl(curso?.fotoPortadaUrl)}
                  alt={curso?.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/1200x400?text=Sin+Imagen';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <GraduationCap size={24} />
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-bold drop-shadow-lg">{curso?.nombre}</h2>
                  </div>
                  <p className="text-white/95 text-base sm:text-lg drop-shadow-md max-w-3xl">{curso?.descripcion}</p>
                </div>
              </div>
            </div>

            {/* Detalles del curso */}
            <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                  <FileText size={20} />
                </div>
                <h3 className="text-xl font-bold text-[#2D3748]">Detalles del Curso</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[#718096] text-sm font-medium">Docente responsable</p>
                  <p className="font-semibold text-[#2D3748] text-lg">
                    {curso?.docenteId?.nombre} {curso?.docenteId?.apellido}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[#718096] text-sm font-medium">Correo del docente</p>
                  <p className="font-medium text-[#2D3748]">{curso?.docenteId?.correo}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[#718096] text-sm font-medium">Fecha de creación</p>
                  <p className="font-medium text-[#2D3748]">
                    {new Date(curso?.fechaCreacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[#718096] text-sm font-medium">ID del curso</p>
                  <p className="font-mono text-xs text-[#718096] bg-[#F7FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0]">
                    {curso?._id}
                  </p>
                </div>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                  <LayoutDashboard size={20} />
                </div>
                <h3 className="text-xl font-bold text-[#2D3748]">Accesos Rápidos</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => navegarA('/profesor/cursos/informacion/calendario')}
                  className="flex items-center gap-4 p-4 bg-[#00B9F0]/5 hover:bg-[#00B9F0]/10 rounded-xl border border-[#00B9F0]/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#00B9F0] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <CalendarDays size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-[#2D3748]">Calendario</p>
                    <p className="text-xs text-[#718096]">Ver eventos y fechas</p>
                  </div>
                </button>

                <button
                  onClick={() => navegarA('/profesor/cursos/informacion/foro')}
                  className="flex items-center gap-4 p-4 bg-[#FE327B]/5 hover:bg-[#FE327B]/10 rounded-xl border border-[#FE327B]/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FE327B] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <MessageCircle size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-[#2D3748]">Foro</p>
                    <p className="text-xs text-[#718096]">Discusiones del curso</p>
                  </div>
                </button>

                <button
                  onClick={() => navegarA('/profesor/cursos/crear/modulos/tareas/entregas')}
                  className="flex items-center gap-4 p-4 bg-[#7AD107]/5 hover:bg-[#7AD107]/10 rounded-xl border border-[#7AD107]/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#7AD107] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <FileCheck size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-[#2D3748]">Revisar Tareas</p>
                    <p className="text-xs text-[#718096]">Calificar entregas</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* SECCIÓN: PARTICIPANTES */}
        {seccionActiva === "participantes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                  <Users size={20} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#2D3748]">
                  Participantes del Curso
                </h3>
                <span className="bg-[#00B9F0]/10 text-[#00B9F0] px-3 py-1 rounded-full text-sm font-semibold border border-[#00B9F0]/20">
                  {participantes.length}
                </span>
              </div>
            </div>

            {participantes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-12 sm:p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-6">
                  <Users className="text-[#718096]" size={40} />
                </div>
                <p className="text-[#2D3748] text-lg font-medium mb-2">
                  No hay participantes registrados
                </p>
                <p className="text-[#718096] text-sm mb-6">
                  Comienza agregando participantes al curso
                </p>
                <button
                  onClick={() => navegarA("/profesor/cursos/crear/registropadres")}
                  className="inline-flex items-center gap-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <UserPlus size={20} />
                  Registrar Participantes
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {participantes.map((participante) => {
                  const usuarioId =
                    participante.usuarioId?._id || participante.usuarioId;
                  const usuario = participante.usuarioId;
                  const avatarUrl = getAvatarUrl(usuario?.fotoPerfilUrl);

                  return (
                    <div
                      key={`participante-${usuarioId}-${participante._id || Math.random()}`}
                      className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-5 hover:shadow-lg transition-all hover:border-[#00B9F0]/30"
                    >
                      <div className="flex items-center justify-between gap-4">

                        <div className="flex items-center gap-4 flex-1 min-w-0">

                          {/* Imagen del avatar */}
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={participante.usuarioId?.nombre}
                              className="w-14 h-14 rounded-full object-cover border-2 border-[#00B9F0]/20"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}

                          {/* Avatar con inicial */}
                          <div
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center text-white font-bold text-lg"
                            style={{ display: avatarUrl ? "none" : "flex" }}
                          >
                            {(participante.usuarioId?.nombre?.[0] || "U").toUpperCase()}
                          </div>

                          {/* Información del participante */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#2D3748] text-lg truncate">
                              {participante.usuarioId?.nombre || "Sin nombre"}{" "}
                              {participante.usuarioId?.apellido || ""}
                            </p>

                            <p className="text-sm text-[#718096] flex items-center gap-2 truncate">
                              <Mail size={14} />
                              {participante.usuarioId?.correo || "Sin correo"}
                            </p>

                            {participante.usuarioId?.telefono && (
                              <p className="text-xs text-[#718096] flex items-center gap-2 mt-1">
                                <Phone size={12} />
                                {participante.usuarioId.telefono}
                              </p>
                            )}
                          </div>

                          {/* Rol o etiqueta */}
                          <span className="text-sm font-semibold text-[#00B9F0] bg-[#E6F9FF] px-3 py-1 rounded-lg whitespace-nowrap">
                            {participante.etiqueta ||
                              participante.usuarioId?.rol ||
                              "Sin rol"}
                          </span>

                          {/* Botón ver información */}
                          <button
                            onClick={() => setModalParticipante(participante)}
                            className="w-10 h-10 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all flex items-center justify-center"
                            title="Ver información"
                          >
                            <Eye size={18} />
                          </button>

                          {/* Botón eliminar */}
                          {participante.etiqueta !== "docente" && (
                            <button
                              onClick={() => setParticipanteAEliminar(participante)}
                              className="w-10 h-10 bg-[#FA6D00] hover:bg-[#FA6D00]/90 text-white rounded-lg transition-all flex items-center justify-center"
                              title="Eliminar participante"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


        {/* SECCIÓN: TAREAS */}
        {seccionActiva === 'tareas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                  <ClipboardList size={20} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#2D3748]">
                  Tareas del Curso
                </h3>
                <span className="bg-[#00B9F0]/10 text-[#00B9F0] px-3 py-1 rounded-full text-sm font-semibold border border-[#00B9F0]/20">
                  {tareas.length}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFiltroTareas('todas')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filtroTareas === 'todas'
                      ? 'bg-[#00B9F0] text-white shadow-md'
                      : 'bg-white text-[#718096] hover:bg-[#F7FAFC] border border-[#E2E8F0]'
                    }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFiltroTareas('abiertas')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filtroTareas === 'abiertas'
                      ? 'bg-[#7AD107] text-white shadow-md'
                      : 'bg-white text-[#718096] hover:bg-[#F7FAFC] border border-[#E2E8F0]'
                    }`}
                >
                  Abiertas
                </button>
                <button
                  onClick={() => setFiltroTareas('cerradas')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filtroTareas === 'cerradas'
                      ? 'bg-[#718096] text-white shadow-md'
                      : 'bg-white text-[#718096] hover:bg-[#F7FAFC] border border-[#E2E8F0]'
                    }`}
                >
                  Cerradas
                </button>
                <button
                  onClick={() => setFiltroTareas('proximas')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filtroTareas === 'proximas'
                      ? 'bg-[#FA6D00] text-white shadow-md'
                      : 'bg-white text-[#718096] hover:bg-[#F7FAFC] border border-[#E2E8F0]'
                    }`}
                >
                  Próximas
                </button>
              </div>
            </div>

            {tareasFiltradas.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-12 sm:p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-6">
                  <ClipboardList className="text-[#718096]" size={40} />
                </div>
                <p className="text-[#2D3748] text-lg font-medium mb-2">
                  {filtroTareas === 'todas'
                    ? 'No hay tareas creadas'
                    : `No hay tareas ${filtroTareas}`}
                </p>
                <p className="text-[#718096] text-sm mb-6">
                  Crea tareas para que los participantes puedan trabajar
                </p>
                <button
                  onClick={() => navegarA('/profesor/cursos/crear/modulos/tareas')}
                  className="inline-flex items-center gap-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
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
                      className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6 hover:shadow-lg transition-all hover:border-[#00B9F0]/30"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h4 className="text-xl font-bold text-[#2D3748]">{tarea.titulo}</h4>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${estadoBadge.color}`}>
                              <IconoEstado size={14} />
                              {estadoBadge.texto}
                            </span>
                          </div>
                          <p className="text-[#718096] text-sm mb-4 leading-relaxed">{tarea.descripcion}</p>

                          <div className="flex flex-wrap gap-3 text-sm">
                            {tarea.fechaLimite && (
                              <div className="flex items-center gap-2 bg-[#F7FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0]">
                                <div className="w-6 h-6 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                                  <Calendar size={12} />
                                </div>
                                <span className="text-[#2D3748] font-medium">
                                  {new Date(tarea.fechaLimite).toLocaleDateString('es-ES')}
                                </span>
                                {diasRestantes !== null && tarea.estado !== 'cerrada' && (
                                  <span className={`ml-1 font-semibold ${diasRestantes < 0
                                      ? 'text-[#FA6D00]'
                                      : diasRestantes <= 3
                                        ? 'text-[#FED31F]'
                                        : 'text-[#7AD107]'
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
                              <div className="flex items-center gap-2 bg-[#FE327B]/5 px-3 py-2 rounded-lg border border-[#FE327B]/20">
                                <div className="w-6 h-6 rounded-full bg-[#FE327B] flex items-center justify-center text-white">
                                  <BookOpen size={12} />
                                </div>
                                <span className="text-[#FE327B] font-medium">
                                  {tarea.moduloId.titulo || 'Sin título'}
                                </span>
                              </div>
                            )}
                            {tarea.tipoEntrega && (
                              <div className="flex items-center gap-2 bg-[#01C9F4]/5 px-3 py-2 rounded-lg border border-[#01C9F4]/20">
                                <div className="w-6 h-6 rounded-full bg-[#01C9F4] flex items-center justify-center text-white">
                                  <FileText size={12} />
                                </div>
                                <span className="text-[#01C9F4] font-medium capitalize">
                                  {tarea.tipoEntrega}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 bg-[#7AD107]/5 px-3 py-2 rounded-lg border border-[#7AD107]/20">
                              <div className="w-6 h-6 rounded-full bg-[#7AD107] flex items-center justify-center text-white">
                                <FileCheck size={12} />
                              </div>
                              <span className="text-[#7AD107] font-medium">
                                {cantidadEntregas} {cantidadEntregas === 1 ? 'Entrega' : 'Entregas'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2">
                          <button
                            onClick={() => abrirModalTarea(tarea)}
                            className="w-10 h-10 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all flex items-center justify-center"
                            title="Ver detalles"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => router.push(`/profesor/cursos/crear/modulos/tareas?cursoId=${cursoId}&tareaId=${tarea._id}`)}
                            className="w-10 h-10 bg-[#FE327B] hover:bg-[#FE327B]/90 text-white rounded-lg transition-all flex items-center justify-center"
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

      {/* Modal de Información del Participante */}
      {modalParticipante && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-[#00B9F0] text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <h2 className="text-2xl font-bold">Información del Participante</h2>
                  </div>
                </div>
                <button
                  onClick={() => setModalParticipante(null)}
                  className="w-8 h-8 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Avatar y nombre */}
              <div className="flex flex-col items-center text-center space-y-4">
                {(() => {
                  const [imageError, setImageError] = React.useState(false);
                  const usuario = modalParticipante.usuarioId;
                  const avatarUrl = getAvatarUrl(usuario?.fotoPerfilUrl);
                  const inicial = (usuario?.nombre?.[0] || 'U').toUpperCase();

                  return (
                    <>
                      {avatarUrl && !imageError ? (
                        <img
                          src={avatarUrl}
                          alt={`Avatar de ${usuario?.nombre || 'Usuario'}`}
                          className="w-24 h-24 rounded-full object-cover border-4 border-[#00B9F0]/20 shadow-lg"
                          onError={(e) => {
                            console.warn('❌ Error cargando imagen en modal:', avatarUrl);
                            setImageError(true);
                          }}
                          onLoad={() => {
                            console.log('✅ Imagen cargada en modal:', avatarUrl);
                          }}
                        />
                      ) : (
                        <div
                          className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center text-white font-bold text-3xl shadow-lg"
                        >
                          {inicial}
                        </div>
                      )}
                    </>
                  );
                })()}

                <div>
                  <p className="text-2xl font-bold text-[#2D3748] mb-2">
                    {modalParticipante.usuarioId?.nombre || 'Sin nombre'}{' '}
                    {modalParticipante.usuarioId?.apellido || ''}
                  </p>
                  <span
                    className={`px-4 py-2 rounded-full text-xs font-semibold ${getRolBadgeColor(
                      modalParticipante.etiqueta || modalParticipante.usuarioId?.rol
                    )}`}
                  >
                    {modalParticipante.etiqueta || modalParticipante.usuarioId?.rol || 'Sin rol'}
                  </span>
                </div>
              </div>

              <div className="h-px bg-[#E2E8F0]"></div>

              {/* Información detallada */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#00B9F0]/10 flex items-center justify-center flex-shrink-0">
                    <Badge className="text-[#00B9F0]" size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#718096] font-medium mb-1">ID</p>
                    <p className="text-sm text-[#2D3748] font-semibold break-all">{modalParticipante.usuarioId?._id || modalParticipante._id}</p>
                  </div>
                </div>

                {modalParticipante.usuarioId?.cedula && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FE327B]/10 flex items-center justify-center flex-shrink-0">
                      <Badge className="text-[#FE327B]" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#718096] font-medium mb-1">Cédula</p>
                      <p className="text-sm text-[#2D3748] font-semibold">{modalParticipante.usuarioId.cedula}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#7AD107]/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="text-[#7AD107]" size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#718096] font-medium mb-1">Correo</p>
                    <p className="text-sm text-[#2D3748] font-semibold break-all">{modalParticipante.usuarioId?.correo || 'Sin correo'}</p>
                  </div>
                </div>

                {modalParticipante.usuarioId?.telefono && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FA6D00]/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="text-[#FA6D00]" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#718096] font-medium mb-1">Teléfono</p>
                      <p className="text-sm text-[#2D3748] font-semibold">{modalParticipante.usuarioId.telefono}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#01C9F4]/10 flex items-center justify-center flex-shrink-0">
                    <School className="text-[#01C9F4]" size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#718096] font-medium mb-1">Rol</p>
                    <p className="text-sm text-[#2D3748] font-semibold uppercase">
                      {modalParticipante.usuarioId?.rol || 'Sin rol'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setModalParticipante(null)}
                className="px-6 py-2.5 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {participanteAEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header del Modal */}
            <div className="bg-[#FA6D00] text-white p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <h2 className="text-2xl font-bold">Confirmar Eliminación</h2>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              <p className="text-[#2D3748] text-base leading-relaxed">
                ¿Estás seguro de eliminar a{' '}
                <span className="font-bold">
                  {participanteAEliminar.usuarioId?.nombre} {participanteAEliminar.usuarioId?.apellido}
                </span>{' '}
                del curso? Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Footer del Modal */}
            <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex justify-end gap-3">
              <button
                onClick={() => setParticipanteAEliminar(null)}
                className="px-6 py-2.5 bg-white hover:bg-[#E2E8F0] text-[#2D3748] border border-[#E2E8F0] rounded-lg transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminarParticipante(participanteAEliminar.usuarioId?._id || participanteAEliminar.usuarioId)}
                className="px-6 py-2.5 bg-[#FA6D00] hover:bg-[#FA6D00]/90 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Tarea */}
      {modalTarea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-[#00B9F0] text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <ClipboardList size={18} />
                    </div>
                    <h2 className="text-2xl font-bold">{modalTarea.titulo}</h2>
                  </div>
                  <p className="text-white/90">{modalTarea.descripcion}</p>
                </div>
                <button
                  onClick={cerrarModalTarea}
                  className="w-8 h-8 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información Principal */}
              <div className="grid sm:grid-cols-2 gap-4">
                {modalTarea.fechaLimite && (
                  <div className="bg-[#F7FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                    <p className="text-[#718096] text-sm font-medium mb-2">Fecha límite</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                        <Calendar size={16} />
                      </div>
                      <p className="text-[#2D3748] font-semibold">
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
                  <div className="bg-[#F7FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                    <p className="text-[#718096] text-sm font-medium mb-2">Estado</p>
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
                  <div className="bg-[#F7FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                    <p className="text-[#718096] text-sm font-medium mb-2">Tipo de entrega</p>
                    <p className="text-[#2D3748] font-semibold capitalize">{modalTarea.tipoEntrega}</p>
                  </div>
                )}

                {modalTarea.moduloId && (
                  <div className="bg-[#F7FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                    <p className="text-[#718096] text-sm font-medium mb-2">Módulo</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#FE327B] flex items-center justify-center text-white">
                        <BookOpen size={16} />
                      </div>
                      <p className="text-[#2D3748] font-semibold">{modalTarea.moduloId.titulo || 'Sin título'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Asignación */}
              {modalTarea.asignacionTipo && (
                <div className="bg-[#00B9F0]/5 p-4 rounded-lg border border-[#00B9F0]/20">
                  <p className="text-[#00B9F0] font-semibold mb-2">Tipo de asignación</p>
                  <p className="text-[#2D3748]">
                    {modalTarea.asignacionTipo === 'todos'
                      ? 'Asignada a todos los participantes del curso'
                      : `Asignada a ${modalTarea.participantesSeleccionados?.length || 0} participantes específicos`}
                  </p>
                </div>
              )}

              {/* Archivos Adjuntos */}
              {modalTarea.archivosAdjuntos && modalTarea.archivosAdjuntos.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-[#2D3748] mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                      <File size={16} />
                    </div>
                    Archivos Adjuntos ({modalTarea.archivosAdjuntos.length})
                  </h3>
                  <div className="space-y-2">
                    {modalTarea.archivosAdjuntos.map((archivo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-[#F7FAFC] rounded-lg border border-[#E2E8F0] hover:bg-[#E2E8F0]/50 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white flex-shrink-0">
                            {archivo.tipo === 'enlace' ? (
                              <ExternalLink size={18} />
                            ) : (
                              <File size={18} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#2D3748] truncate">{archivo.nombre}</p>
                            {archivo.tipo === 'archivo' && archivo.formato && (
                              <p className="text-xs text-[#718096] uppercase">{archivo.formato}</p>
                            )}
                            {archivo.descripcion && (
                              <p className="text-sm text-[#718096]">{archivo.descripcion}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => descargarArchivo(archivo.url, archivo.nombre)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-medium text-sm flex-shrink-0"
                        >
                          <Download size={16} />
                          <span className="hidden sm:inline">{archivo.tipo === 'enlace' ? 'Abrir' : 'Descargar'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Ver Entregas */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                <button
                  onClick={() => verEntregas(modalTarea._id)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  <FileCheck size={20} />
                  Ver Entregas ({entregasPorTarea[modalTarea._id] || 0})
                </button>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex flex-wrap justify-end gap-3">
              <button
                onClick={cerrarModalTarea}
                className="px-6 py-2.5 bg-white hover:bg-[#E2E8F0] text-[#2D3748] border border-[#E2E8F0] rounded-lg transition-all font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  cerrarModalTarea();
                  router.push(`/profesor/cursos/crear/modulos/tareas?cursoId=${cursoId}&tareaId=${modalTarea._id}`);
                }}
                className="px-6 py-2.5 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
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
