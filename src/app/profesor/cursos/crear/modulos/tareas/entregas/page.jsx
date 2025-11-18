'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Home,
  FileCheck,
  Download,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  MessageSquare,
  Award,
  Search,
  Filter,
  TrendingUp,
  Users,
  ClipboardList,
  X,
  ExternalLink,
  File,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  FileImage
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-edumon.onrender.com';

import LoadingScreen from '@/components/LoadingScreen'; // Ajusta la ruta según tu estructura


const EntregasPage = () => {
  const [entregas, setEntregas] = useState([]);
  const [tarea, setTarea] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [modalEntrega, setModalEntrega] = useState(null);
  const [modalCalificar, setModalCalificar] = useState(null);
  const [modalVisualizador, setModalVisualizador] = useState(null);
  const [calificacion, setCalificacion] = useState({ nota: '', comentario: '' });
  const [calificando, setCalificando] = useState(false);
  const [error, setError] = useState('');
  const [exitoMensaje, setExitoMensaje] = useState('');
  const [cursoId, setCursoId] = useState(null);
  const [tareaId, setTareaId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const curso = urlParams.get('cursoId');
    const tarea = urlParams.get('tareaId');
    
    if (curso && tarea) {
      setCursoId(curso);
      setTareaId(tarea);
      cargarEntregas(tarea);
    } else {
      mostrarError('No se especificó un curso o tarea válidos');
      setLoading(false);
    }
  }, []);

  const mostrarError = (mensaje) => {
    setError(mensaje);
    setTimeout(() => setError(''), 5000);
  };

  const mostrarExito = (mensaje) => {
    setExitoMensaje(mensaje);
    setTimeout(() => setExitoMensaje(''), 3000);
  };

  const cargarEntregas = async (tareaIdParam) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      mostrarError('No hay sesión activa. Por favor inicia sesión.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/entregas/tarea/${tareaIdParam}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        throw new Error('Error al cargar las entregas');
      }

      const data = await response.json();
      
      setEntregas(data.entregas || []);
      setTarea(data.tarea || null);
      setEstadisticas(data.estadisticas || null);

    } catch (error) {
      console.error('Error cargando entregas:', error);
      mostrarError('Error al cargar las entregas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'enviada':
        return { color: 'bg-[#7AD107]/10 text-[#7AD107] border border-[#7AD107]/20', icon: CheckCircle, texto: 'Enviada' };
      case 'tarde':
        return { color: 'bg-[#FA6D00]/10 text-[#FA6D00] border border-[#FA6D00]/20', icon: Clock, texto: 'Tarde' };
      case 'calificada':
        return { color: 'bg-[#00B9F0]/10 text-[#00B9F0] border border-[#00B9F0]/20', icon: Award, texto: 'Calificada' };
      case 'borrador':
        return { color: 'bg-[#718096]/10 text-[#718096] border border-[#718096]/20', icon: FileText, texto: 'Borrador' };
      default:
        return { color: 'bg-[#E2E8F0] text-[#718096] border border-[#E2E8F0]', icon: AlertCircle, texto: estado };
    }
  };

  const getFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return imageExtensions.some(ext => filename?.toLowerCase().endsWith(ext));
  };

  const isPDFFile = (filename) => {
    return filename?.toLowerCase().endsWith('.pdf');
  };

  const getEntregasFiltradas = () => {
    let entregasFiltradas = [...entregas];

    if (filtroEstado !== 'todas') {
      entregasFiltradas = entregasFiltradas.filter(e => e.estado === filtroEstado);
    }

    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      entregasFiltradas = entregasFiltradas.filter(e => {
        const nombreCompleto = `${e.padreId?.nombre || ''} ${e.padreId?.apellido || ''}`.toLowerCase();
        const correo = (e.padreId?.correo || '').toLowerCase();
        return nombreCompleto.includes(busquedaLower) || correo.includes(busquedaLower);
      });
    }

    return entregasFiltradas;
  };

  const abrirModalEntrega = (entrega) => {
    setModalEntrega(entrega);
  };

  const cerrarModalEntrega = () => {
    setModalEntrega(null);
  };

  const abrirModalCalificar = (entrega) => {
    setModalCalificar(entrega);
    setCalificacion({
      nota: entrega.calificacion?.nota || '',
      comentario: entrega.calificacion?.comentario || ''
    });
  };

  const cerrarModalCalificar = () => {
    setModalCalificar(null);
    setCalificacion({ nota: '', comentario: '' });
  };

  const abrirVisualizador = (archivo) => {
    setModalVisualizador(archivo);
  };

  const cerrarVisualizador = () => {
    setModalVisualizador(null);
  };

  const handleCalificar = async () => {
    if (!calificacion.nota || calificacion.nota < 0 || calificacion.nota > 100) {
      mostrarError('Por favor ingresa una nota válida entre 0 y 100');
      return;
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      mostrarError('Usuario no encontrado');
      return;
    }

    const user = JSON.parse(userStr);
    const docenteId = user.id || user._id;

    try {
      setCalificando(true);

      const response = await fetch(`${API_BASE_URL}/entregas/${modalCalificar._id}/calificar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nota: parseFloat(calificacion.nota),
          comentario: calificacion.comentario,
          docenteId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al calificar');
      }

      mostrarExito('Entrega calificada exitosamente');
      cerrarModalCalificar();
      cargarEntregas(tareaId);

    } catch (error) {
      console.error('Error calificando entrega:', error);
      mostrarError('Error al calificar: ' + error.message);
    } finally {
      setCalificando(false);
    }
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

  const navegarAtras = () => {
    window.history.back();
  };

  const navegarInicio = () => {
    window.location.href = '/profesor';
  };

  if (loading) {
    return <LoadingScreen mensaje="Cargando entregas de la tarea..." />;
  }

  const entregasFiltradas = getEntregasFiltradas();

  return (
    <div className="min-h-screen bg-white">
      {/* Notificaciones flotantes */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
          <div className="bg-white border-l-4 border-[#FA6D00] rounded-xl shadow-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-[#FA6D00] flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-[#2D3748] font-medium text-sm">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-[#718096] hover:text-[#2D3748]">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {exitoMensaje && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
          <div className="bg-white border-l-4 border-[#7AD107] rounded-xl shadow-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="text-[#7AD107] flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-[#2D3748] font-medium text-sm">{exitoMensaje}</p>
            </div>
            <button onClick={() => setExitoMensaje('')} className="text-[#718096] hover:text-[#2D3748]">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={navegarAtras}
                className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white hover:bg-[#01C9F4] transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="h-8 w-px bg-[#E2E8F0]"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center">
                  <FileCheck className="text-white" size={20} />
                </div>
                <h1 className="text-xl font-bold text-[#2D3748]">Entregas de Tarea</h1>
              </div>
            </div>

            <button
              onClick={navegarInicio}
              className="w-10 h-10 bg-[#E2E8F0] hover:bg-[#718096] rounded-lg transition-all flex items-center justify-center group"
              title="Inicio"
            >
              <Home size={18} className="text-[#718096] group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Información de la Tarea */}
      {tarea && (
        <div className="bg-white shadow-sm border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#2D3748] mb-1">{tarea.titulo}</h2>
                {tarea.fechaEntrega && (
                  <p className="text-[#718096] flex items-center gap-2">
                    <Calendar size={16} className="text-[#00B9F0]" />
                    Fecha límite: {new Date(tarea.fechaEntrega).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: estadisticas.total, color: '#00B9F0', icon: ClipboardList },
              { label: 'A Tiempo', value: estadisticas.enviadas, color: '#7AD107', icon: CheckCircle },
              { label: 'Tarde', value: estadisticas.tarde, color: '#FA6D00', icon: Clock },
              { label: 'Calificadas', value: estadisticas.calificadas, color: '#00B9F0', icon: Award }
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-5 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-[#2D3748]">{stat.value}</div>
                    <div className="text-sm text-[#718096] mt-1 font-medium">{stat.label}</div>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: stat.color }}>
                    <stat.icon className="text-white" size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#718096]" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre o correo del estudiante..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748]"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'todas', label: 'Todas', color: '#718096' },
                { value: 'enviada', label: 'A Tiempo', color: '#7AD107' },
                { value: 'tarde', label: 'Tarde', color: '#FA6D00' }
              ].map(filtro => (
                <button
                  key={filtro.value}
                  onClick={() => setFiltroEstado(filtro.value)}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    filtroEstado === filtro.value
                      ? 'text-white shadow-md'
                      : 'bg-[#F7FAFC] text-[#718096] hover:bg-[#E2E8F0]'
                  }`}
                  style={filtroEstado === filtro.value ? { backgroundColor: filtro.color } : {}}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Entregas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {entregasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-6">
              <FileCheck className="text-[#718096]" size={40} />
            </div>
            <p className="text-[#2D3748] text-lg font-medium mb-2">
              {entregas.length === 0 
                ? 'No hay entregas para esta tarea' 
                : 'No se encontraron entregas con los filtros aplicados'}
            </p>
            <p className="text-[#718096] text-sm">
              {entregas.length === 0 
                ? 'Las entregas aparecerán cuando los estudiantes las envíen' 
                : 'Intenta ajustar los filtros de búsqueda'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {entregasFiltradas.map((entrega) => {
              const estadoBadge = getEstadoBadge(entrega.estado);
              const IconoEstado = estadoBadge.icon;
              const tieneCalificacion = entrega.calificacion && entrega.calificacion.nota !== undefined;

              return (
                <div
                  key={entrega._id}
                  className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6 hover:shadow-lg transition-all hover:border-[#00B9F0]/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center text-white font-bold text-lg">
                          {entrega.padreId?.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-[#2D3748]">
                            {entrega.padreId?.nombre} {entrega.padreId?.apellido}
                          </h3>
                          <p className="text-sm text-[#718096]">{entrega.padreId?.correo}</p>
                        </div>
                        <span className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${estadoBadge.color}`}>
                          <IconoEstado size={16} />
                          {estadoBadge.texto}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm mb-4">
                        {entrega.fechaEntrega && (
                          <div className="flex items-center gap-2 bg-[#F7FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0]">
                            <div className="w-6 h-6 rounded-full bg-[#00B9F0] flex items-center justify-center">
                              <Calendar className="text-white" size={12} />
                            </div>
                            <span className="text-[#2D3748] font-medium">
                              {new Date(entrega.fechaEntrega).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        )}

                        {entrega.archivosAdjuntos && entrega.archivosAdjuntos.length > 0 && (
                          <div className="flex items-center gap-2 bg-[#00B9F0]/10 px-3 py-2 rounded-lg border border-[#00B9F0]/20">
                            <div className="w-6 h-6 rounded-full bg-[#00B9F0] flex items-center justify-center">
                              <File className="text-white" size={12} />
                            </div>
                            <span className="text-[#00B9F0] font-semibold">
                              {entrega.archivosAdjuntos.length} archivo{entrega.archivosAdjuntos.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        {tieneCalificacion && (
                          <div className="flex items-center gap-2 bg-[#7AD107]/10 px-3 py-2 rounded-lg border border-[#7AD107]/20">
                            <div className="w-6 h-6 rounded-full bg-[#7AD107] flex items-center justify-center">
                              <Award className="text-white" size={12} />
                            </div>
                            <span className="text-[#7AD107] font-bold">
                              {entrega.calificacion.nota}/100
                            </span>
                          </div>
                        )}
                      </div>

                      {entrega.textoRespuesta && (
                        <div className="bg-[#F7FAFC] p-3 rounded-lg border border-[#E2E8F0] mb-4">
                          <p className="text-[#2D3748] text-sm line-clamp-2">
                            {entrega.textoRespuesta}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => abrirModalEntrega(entrega)}
                        className="w-10 h-10 bg-[#00B9F0] hover:bg-[#01C9F4] rounded-lg transition-all flex items-center justify-center"
                        title="Ver detalles"
                      >
                        <Eye size={18} className="text-white" />
                      </button>
                      {!tieneCalificacion && (
                        <button
                          onClick={() => abrirModalCalificar(entrega)}
                          className="w-10 h-10 bg-[#7AD107] hover:bg-[#7AD107]/90 rounded-lg transition-all flex items-center justify-center"
                          title="Calificar"
                        >
                          <Award size={18} className="text-white" />
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

      {/* Modal Ver Entrega */}
      {modalEntrega && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 bg-[#00B9F0] text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <FileCheck size={20} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Detalles de la Entrega</h2>
                  </div>
                  <p className="text-white/90">
                    {modalEntrega.padreId?.nombre} {modalEntrega.padreId?.apellido}
                  </p>
                </div>
                <button
                  onClick={cerrarModalEntrega}
                  className="w-8 h-8 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Información del Estudiante */}
              <div className="bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <h3 className="text-lg font-bold text-[#2D3748] mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#00B9F0] flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  Información del Estudiante
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#718096] text-sm font-medium mb-1">Nombre completo</p>
                    <p className="text-[#2D3748] font-semibold">
                      {modalEntrega.padreId?.nombre} {modalEntrega.padreId?.apellido}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#718096] text-sm font-medium mb-1">Correo electrónico</p>
                    <p className="text-[#2D3748] font-semibold">{modalEntrega.padreId?.correo}</p>
                  </div>
                  {modalEntrega.padreId?.telefono && (
                    <div>
                      <p className="text-[#718096] text-sm font-medium mb-1">Teléfono</p>
                      <p className="text-[#2D3748] font-semibold">{modalEntrega.padreId.telefono}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado y Fechas */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                  <p className="text-[#718096] text-sm font-medium mb-2">Estado</p>
                  {(() => {
                    const badge = getEstadoBadge(modalEntrega.estado);
                    const IconoEstado = badge.icon;
                    return (
                      <span className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 w-fit ${badge.color}`}>
                        <IconoEstado size={16} />
                        {badge.texto}
                      </span>
                    );
                  })()}
                </div>

                {modalEntrega.fechaEntrega && (
                  <div className="bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <p className="text-[#718096] text-sm font-medium mb-2">Fecha de entrega</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#00B9F0] flex items-center justify-center">
                        <Calendar className="text-white" size={12} />
                      </div>
                      <p className="text-[#2D3748] font-semibold">
                        {new Date(modalEntrega.fechaEntrega).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Respuesta en Texto */}
              {modalEntrega.textoRespuesta && (
                <div>
                  <h3 className="text-lg font-bold text-[#2D3748] mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00B9F0] flex items-center justify-center">
                      <MessageSquare size={16} className="text-white" />
                    </div>
                    Respuesta del Estudiante
                  </h3>
                  <div className="bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <p className="text-[#2D3748] whitespace-pre-wrap">{modalEntrega.textoRespuesta}</p>
                  </div>
                </div>
              )}

              {/* Archivos Adjuntos */}
              {modalEntrega.archivosAdjuntos && modalEntrega.archivosAdjuntos.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-[#2D3748] mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00B9F0] flex items-center justify-center">
                      <File size={16} className="text-white" />
                    </div>
                    Archivos Adjuntos ({modalEntrega.archivosAdjuntos.length})
                  </h3>
                  <div className="space-y-2">
                    {modalEntrega.archivosAdjuntos.map((archivo, index) => {
                      const fileUrl = getFileUrl(archivo.url);
                      const isImage = isImageFile(archivo.nombreOriginal);
                      const isPDF = isPDFFile(archivo.nombreOriginal);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-[#F7FAFC] rounded-xl border border-[#E2E8F0] hover:bg-white transition-all"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center flex-shrink-0">
                              {isImage ? (
                                <ImageIcon className="text-white" size={18} />
                              ) : (
                                <File className="text-white" size={18} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#2D3748] truncate">
                                {archivo.nombreOriginal || 'Archivo'}
                              </p>
                              {archivo.tipoArchivo && (
                                <p className="text-xs text-[#718096]">{archivo.tipoArchivo}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {(isImage || isPDF) && (
                              <button
                                onClick={() => abrirVisualizador({ ...archivo, url: fileUrl })}
                                className="flex items-center gap-2 px-4 py-2 bg-[#FE327B] hover:bg-[#FE327B]/90 text-white rounded-lg transition-all font-medium text-sm"
                              >
                                <Eye size={16} className="text-white" />
                                Ver
                              </button>
                            )}
                            <button
                              onClick={() => descargarArchivo(fileUrl, archivo.nombreOriginal)}
                              className="flex items-center gap-2 px-4 py-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-medium text-sm"
                            >
                              <Download size={16} className="text-white" />
                              Descargar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Calificación */}
              {modalEntrega.calificacion && modalEntrega.calificacion.nota !== undefined && (
                <div className="bg-[#7AD107]/10 p-5 rounded-xl border-2 border-[#7AD107]/20">
                  <h3 className="text-lg font-bold text-[#7AD107] mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#7AD107] flex items-center justify-center">
                      <Award size={16} className="text-white" />
                    </div>
                    Calificación
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[#7AD107] font-medium text-sm mb-1">Nota</p>
                      <p className="text-3xl font-bold text-[#7AD107]">
                        {modalEntrega.calificacion.nota}/100
                      </p>
                    </div>
                    {modalEntrega.calificacion.comentario && (
                      <div>
                        <p className="text-[#7AD107] font-medium text-sm mb-1">Comentario del docente</p>
                        <p className="text-[#2D3748] bg-white p-3 rounded-lg border border-[#7AD107]/20">
                          {modalEntrega.calificacion.comentario}
                        </p>
                      </div>
                    )}
                    {modalEntrega.calificacion.fechaCalificacion && (
                      <div>
                        <p className="text-[#7AD107] font-medium text-sm mb-1">Fecha de calificación</p>
                        <p className="text-[#2D3748] flex items-center gap-2">
                          <Calendar size={16} className="text-[#7AD107]" />
                          {new Date(modalEntrega.calificacion.fechaCalificacion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex justify-end gap-3">
              <button
                onClick={cerrarModalEntrega}
                className="px-6 py-3 bg-[#E2E8F0] hover:bg-[#718096] hover:text-white text-[#2D3748] rounded-lg transition-all font-medium"
              >
                Cerrar
              </button>
              {!modalEntrega.calificacion && (
                <button
                  onClick={() => {
                    cerrarModalEntrega();
                    abrirModalCalificar(modalEntrega);
                  }}
                  className="px-6 py-3 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Award size={16} className="text-white" />
                  Calificar Entrega
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Calificar */}
      {modalCalificar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-scale-in">
            <div className="bg-[#7AD107] p-6 rounded-t-2xl">
              <div className="flex items-start justify-between text-white">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Award size={20} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Calificar Entrega</h2>
                  </div>
                  <p className="text-white/90">
                    {modalCalificar.padreId?.nombre} {modalCalificar.padreId?.apellido}
                  </p>
                </div>
                <button
                  onClick={cerrarModalCalificar}
                  className="w-8 h-8 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center"
                  disabled={calificando}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[#2D3748] font-semibold mb-2">
                  Nota (0-100) <span className="text-[#FA6D00]">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={calificacion.nota}
                  onChange={(e) => setCalificacion({ ...calificacion, nota: e.target.value })}
                  placeholder="Ingresa la nota"
                  className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#7AD107] focus:border-transparent text-lg font-semibold text-[#2D3748]"
                  disabled={calificando}
                />
                <p className="text-sm text-[#718096] mt-1">
                  Ingresa un valor entre 0 y 100
                </p>
              </div>

              <div>
                <label className="block text-[#2D3748] font-semibold mb-2">
                  Comentario
                </label>
                <textarea
                  value={calificacion.comentario}
                  onChange={(e) => setCalificacion({ ...calificacion, comentario: e.target.value })}
                  placeholder="Escribe un comentario para el estudiante (opcional)"
                  rows="5"
                  className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#7AD107] focus:border-transparent resize-none text-[#2D3748]"
                  disabled={calificando}
                />
                <p className="text-sm text-[#718096] mt-1">
                  Proporciona retroalimentación útil para el estudiante
                </p>
              </div>

              {calificacion.nota && (
                <div className="bg-[#7AD107]/10 p-4 rounded-xl border border-[#7AD107]/20">
                  <p className="text-[#7AD107] font-semibold mb-2">Vista previa:</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#7AD107] flex items-center justify-center">
                      <Award className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#7AD107]">
                        {calificacion.nota}/100
                      </p>
                      <p className="text-sm text-[#718096]">
                        {calificacion.nota >= 70 ? 'Aprobado' : 'Necesita mejorar'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex justify-end gap-3">
              <button
                onClick={cerrarModalCalificar}
                className="px-6 py-3 bg-[#E2E8F0] hover:bg-[#718096] hover:text-white text-[#2D3748] rounded-lg transition-all font-medium"
                disabled={calificando}
              >
                Cancelar
              </button>
              <button
                onClick={handleCalificar}
                disabled={!calificacion.nota || calificando}
                className={`px-6 py-3 rounded-lg transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2 ${
                  !calificacion.nota || calificando
                    ? 'bg-[#E2E8F0] text-[#718096] cursor-not-allowed'
                    : 'bg-[#7AD107] hover:bg-[#7AD107]/90 text-white'
                }`}
              >
                {calificando ? (
                  <>
                    <Loader2 className="animate-spin text-white" size={18} />
                    <span>Calificando...</span>
                  </>
                ) : (
                  <>
                    <Award size={18} className="text-white" />
                    <span>Guardar Calificación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizador de Archivos */}
      {modalVisualizador && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] animate-scale-in">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={() => descargarArchivo(modalVisualizador.url, modalVisualizador.nombreOriginal)}
                className="px-4 py-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-medium flex items-center gap-2"
              >
                <Download size={18} className="text-white" />
                Descargar
              </button>
              <button
                onClick={cerrarVisualizador}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all flex items-center justify-center"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="w-full h-full flex items-center justify-center">
              {isImageFile(modalVisualizador.nombreOriginal) ? (
                <img
                  src={modalVisualizador.url}
                  alt={modalVisualizador.nombreOriginal}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : isPDFFile(modalVisualizador.nombreOriginal) ? (
                <iframe
                  src={modalVisualizador.url}
                  className="w-full h-full rounded-lg bg-white"
                  title={modalVisualizador.nombreOriginal}
                />
              ) : (
                <div className="text-center text-white">
                  <File size={64} className="mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">Vista previa no disponible</p>
                  <p className="text-sm text-white/70 mb-4">Este tipo de archivo no se puede visualizar</p>
                  <button
                    onClick={() => descargarArchivo(modalVisualizador.url, modalVisualizador.nombreOriginal)}
                    className="px-6 py-3 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-medium flex items-center gap-2 mx-auto"
                  >
                    <Download size={18} className="text-white" />
                    Descargar Archivo
                  </button>
                </div>
              )}
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg">
              <p className="text-white text-sm font-medium">{modalVisualizador.nombreOriginal}</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EntregasPage;