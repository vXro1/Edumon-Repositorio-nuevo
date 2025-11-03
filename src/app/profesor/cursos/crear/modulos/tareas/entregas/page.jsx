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
  File
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-edumon.onrender.com';

const EntregasPage = () => {
  const [entregas, setEntregas] = useState([]);
  const [tarea, setTarea] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [modalEntrega, setModalEntrega] = useState(null);
  const [modalCalificar, setModalCalificar] = useState(null);
  const [calificacion, setCalificacion] = useState({ nota: '', comentario: '' });
  const [calificando, setCalificando] = useState(false);

  // Simulación de parámetros de URL (en Next.js usarías useSearchParams)
  const [cursoId, setCursoId] = useState(null);
  const [tareaId, setTareaId] = useState(null);

  useEffect(() => {
    // En una app real, obtendrías esto de useSearchParams de Next.js
    // Por ahora, simularemos que vienen de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const curso = urlParams.get('cursoId');
    const tarea = urlParams.get('tareaId');
    
    if (curso && tarea) {
      setCursoId(curso);
      setTareaId(tarea);
      cargarEntregas(tarea);
    } else {
      alert('No se especificó un curso o tarea válidos');
      setLoading(false);
    }
  }, []);

  const cargarEntregas = async (tareaIdParam) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('No hay sesión activa. Por favor inicia sesión.');
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
      alert('Error al cargar las entregas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'enviada':
        return { color: 'bg-green-100 text-green-700 border border-green-200', icon: CheckCircle, texto: 'Enviada' };
      case 'tarde':
        return { color: 'bg-amber-100 text-amber-700 border border-amber-200', icon: Clock, texto: 'Tarde' };
      case 'calificada':
        return { color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: Award, texto: 'Calificada' };
      case 'borrador':
        return { color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: FileText, texto: 'Borrador' };
      default:
        return { color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: AlertCircle, texto: estado };
    }
  };

  const getEntregasFiltradas = () => {
    let entregasFiltradas = [...entregas];

    // Filtrar por estado
    if (filtroEstado !== 'todas') {
      entregasFiltradas = entregasFiltradas.filter(e => e.estado === filtroEstado);
    }

    // Filtrar por búsqueda
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

  const handleCalificar = async () => {
    if (!calificacion.nota || calificacion.nota < 0 || calificacion.nota > 100) {
      alert('Por favor ingresa una nota válida entre 0 y 100');
      return;
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      alert('Usuario no encontrado');
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

      alert('Entrega calificada exitosamente');
      cerrarModalCalificar();
      cargarEntregas(tareaId);

    } catch (error) {
      console.error('Error calificando entrega:', error);
      alert('Error al calificar: ' + error.message);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileCheck className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-gray-700 font-medium">Cargando entregas...</p>
          <p className="text-gray-500 text-sm mt-1">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  const entregasFiltradas = getEntregasFiltradas();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={navegarAtras}
                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-all hover:scale-105"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
                <span className="font-semibold text-sm">Volver</span>
              </button>
              <div className="h-6 w-px bg-gradient-to-b from-indigo-200 to-purple-200"></div>
              <div className="flex items-center gap-2">
                <FileCheck className="text-indigo-600" size={20} />
                <h1 className="text-lg font-bold text-gray-800">Entregas de Tarea</h1>
              </div>
            </div>

            <button
              onClick={navegarInicio}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Inicio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Información de la Tarea */}
      {tarea && (
        <div className="bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{tarea.titulo}</h2>
                {tarea.fechaEntrega && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Calendar size={16} />
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Total Entregas</p>
                  <p className="text-3xl font-bold text-gray-800">{estadisticas.total}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <ClipboardList className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">A Tiempo</p>
                  <p className="text-3xl font-bold text-green-600">{estadisticas.enviadas}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Tarde</p>
                  <p className="text-3xl font-bold text-amber-600">{estadisticas.tarde}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Clock className="text-amber-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Calificadas</p>
                  <p className="text-3xl font-bold text-blue-600">{estadisticas.calificadas}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Award className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre o correo del estudiante..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltroEstado('todas')}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  filtroEstado === 'todas'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltroEstado('enviada')}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  filtroEstado === 'enviada'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                A Tiempo
              </button>
              <button
                onClick={() => setFiltroEstado('tarde')}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  filtroEstado === 'tarde'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tarde
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Entregas */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {entregasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-16 text-center">
            <FileCheck className="mx-auto text-gray-300 mb-6" size={64} />
            <p className="text-gray-600 text-lg font-medium mb-2">
              {entregas.length === 0 
                ? 'No hay entregas para esta tarea' 
                : 'No se encontraron entregas con los filtros aplicados'}
            </p>
            <p className="text-gray-500 text-sm">
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
                  className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-indigo-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Información del Estudiante */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-3 rounded-full">
                          <User className="text-indigo-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800">
                            {entrega.padreId?.nombre} {entrega.padreId?.apellido}
                          </h3>
                          <p className="text-sm text-gray-600">{entrega.padreId?.correo}</p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${estadoBadge.color}`}>
                          <IconoEstado size={14} />
                          {estadoBadge.texto}
                        </span>
                      </div>

                      {/* Información de la Entrega */}
                      <div className="flex flex-wrap gap-4 text-sm mb-4">
                        {entrega.fechaEntrega && (
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            <Calendar className="text-gray-500" size={16} />
                            <span className="text-gray-700 font-medium">
                              Enviada: {new Date(entrega.fechaEntrega).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        )}

                        {entrega.archivosAdjuntos && entrega.archivosAdjuntos.length > 0 && (
                          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                            <File className="text-blue-600" size={16} />
                            <span className="text-blue-700 font-medium">
                              {entrega.archivosAdjuntos.length} {entrega.archivosAdjuntos.length === 1 ? 'archivo' : 'archivos'}
                            </span>
                          </div>
                        )}

                        {tieneCalificacion && (
                          <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                            <Award className="text-green-600" size={16} />
                            <span className="text-green-700 font-bold">
                              Nota: {entrega.calificacion.nota}/100
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Texto de Respuesta (Preview) */}
                      {entrega.textoRespuesta && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                          <p className="text-gray-700 text-sm line-clamp-2">
                            {entrega.textoRespuesta}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => abrirModalEntrega(entrega)}
                        className="p-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-all hover:scale-105"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                      {!tieneCalificacion && (
                        <button
                          onClick={() => abrirModalCalificar(entrega)}
                          className="p-2.5 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-all hover:scale-105"
                          title="Calificar"
                        >
                          <Award size={18} />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileCheck size={28} />
                    <h2 className="text-2xl font-bold">Detalles de la Entrega</h2>
                  </div>
                  <p className="text-white/90">
                    {modalEntrega.padreId?.nombre} {modalEntrega.padreId?.apellido}
                  </p>
                </div>
                <button
                  onClick={cerrarModalEntrega}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información del Estudiante */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <User size={20} className="text-indigo-600" />
                  Información del Estudiante
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Nombre completo</p>
                    <p className="text-gray-800 font-semibold">
                      {modalEntrega.padreId?.nombre} {modalEntrega.padreId?.apellido}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Correo electrónico</p>
                    <p className="text-gray-800 font-semibold">{modalEntrega.padreId?.correo}</p>
                  </div>
                  {modalEntrega.padreId?.telefono && (
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Teléfono</p>
                      <p className="text-gray-800 font-semibold">{modalEntrega.padreId.telefono}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado y Fechas */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-500 text-sm font-medium mb-1">Estado</p>
                  {(() => {
                    const badge = getEstadoBadge(modalEntrega.estado);
                    const IconoEstado = badge.icon;
                    return (
                      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 w-fit ${badge.color}`}>
                        <IconoEstado size={16} />
                        {badge.texto}
                      </span>
                    );
                  })()}
                </div>

                {modalEntrega.fechaEntrega && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium mb-1">Fecha de entrega</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-indigo-600" size={18} />
                      <p className="text-gray-800 font-semibold">
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
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <MessageSquare size={20} className="text-indigo-600" />
                    Respuesta del Estudiante
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{modalEntrega.textoRespuesta}</p>
                  </div>
                </div>
              )}

              {/* Archivos Adjuntos */}
              {modalEntrega.archivosAdjuntos && modalEntrega.archivosAdjuntos.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <File size={20} className="text-indigo-600" />
                    Archivos Adjuntos ({modalEntrega.archivosAdjuntos.length})
                  </h3>
                  <div className="space-y-2">
                    {modalEntrega.archivosAdjuntos.map((archivo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <File className="text-gray-600 flex-shrink-0" size={20} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {archivo.nombreOriginal || 'Archivo'}
                            </p>
                            {archivo.tipoArchivo && (
                              <p className="text-xs text-gray-500">{archivo.tipoArchivo}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => descargarArchivo(archivo.url, archivo.nombreOriginal)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-all font-medium text-sm flex-shrink-0"
                        >
                          <Download size={16} />
                          Descargar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calificación */}
              {modalEntrega.calificacion && modalEntrega.calificacion.nota !== undefined && (
                <div className="bg-green-50 p-5 rounded-lg border-2 border-green-200">
                  <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                    <Award size={20} />
                    Calificación
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-green-700 font-medium text-sm mb-1">Nota</p>
                      <p className="text-3xl font-bold text-green-800">
                        {modalEntrega.calificacion.nota}/100
                      </p>
                    </div>
                    {modalEntrega.calificacion.comentario && (
                      <div>
                        <p className="text-green-700 font-medium text-sm mb-1">Comentario del docente</p>
                        <p className="text-gray-700 bg-white p-3 rounded-lg border border-green-200">
                          {modalEntrega.calificacion.comentario}
                        </p>
                      </div>
                    )}
                    {modalEntrega.calificacion.fechaCalificacion && (
                      <div>
                        <p className="text-green-700 font-medium text-sm mb-1">Fecha de calificación</p>
                        <p className="text-gray-700 flex items-center gap-2">
                          <Calendar size={16} className="text-green-600" />
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

            {/* Footer del Modal */}
            <div className="bg-gray-50 p-4 rounded-b-2xl border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={cerrarModalEntrega}
                className="px-6 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg transition-all font-medium"
              >
                Cerrar
              </button>
              {!modalEntrega.calificacion && (
                <button
                  onClick={() => {
                    cerrarModalEntrega();
                    abrirModalCalificar(modalEntrega);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Award size={16} />
                  Calificar Entrega
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Calificar */}
      {modalCalificar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Award size={28} />
                    <h2 className="text-2xl font-bold">Calificar Entrega</h2>
                  </div>
                  <p className="text-white/90">
                    {modalCalificar.padreId?.nombre} {modalCalificar.padreId?.apellido}
                  </p>
                </div>
                <button
                  onClick={cerrarModalCalificar}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                  disabled={calificando}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Campo Nota */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Nota (0-100) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={calificacion.nota}
                  onChange={(e) => setCalificacion({ ...calificacion, nota: e.target.value })}
                  placeholder="Ingresa la nota"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold"
                  disabled={calificando}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ingresa un valor entre 0 y 100
                </p>
              </div>

              {/* Campo Comentario */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Comentario
                </label>
                <textarea
                  value={calificacion.comentario}
                  onChange={(e) => setCalificacion({ ...calificacion, comentario: e.target.value })}
                  placeholder="Escribe un comentario para el estudiante (opcional)"
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  disabled={calificando}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Proporciona retroalimentación útil para el estudiante
                </p>
              </div>

              {/* Vista previa de la calificación */}
              {calificacion.nota && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-700 font-semibold mb-2">Vista previa:</p>
                  <div className="flex items-center gap-3">
                    <Award className="text-green-600" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-green-800">
                        {calificacion.nota}/100
                      </p>
                      <p className="text-sm text-gray-600">
                        {calificacion.nota >= 70 ? 'Aprobado' : 'Necesita mejorar'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="bg-gray-50 p-4 rounded-b-2xl border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={cerrarModalCalificar}
                className="px-6 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg transition-all font-medium"
                disabled={calificando}
              >
                Cancelar
              </button>
              <button
                onClick={handleCalificar}
                disabled={!calificacion.nota || calificando}
                className={`px-6 py-2.5 rounded-lg transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2 ${
                  !calificacion.nota || calificando
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                }`}
              >
                {calificando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Calificando...
                  </>
                ) : (
                  <>
                    <Award size={16} />
                    Guardar Calificación
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntregasPage;