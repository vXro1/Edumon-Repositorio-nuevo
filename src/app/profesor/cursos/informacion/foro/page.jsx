'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  MessageCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Lock, 
  Unlock,
  X,
  Upload,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Search,
  Filter,
  Home,
  BookOpen,
  Paperclip,
  Download,
  ExternalLink
} from 'lucide-react';

import LoadingScreen from '@/components/LoadingScreen';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-edumon.onrender.com';

const ForoPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursoId = searchParams.get('cursoId');

  const [foros, setForos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [foroSeleccionado, setForoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [archivoPrevisualizar, setArchivoPrevisualizar] = useState(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    publico: false
  });
  const [archivos, setArchivos] = useState([]);
  const [previsualizaciones, setPrevisualizaciones] = useState([]);

  useEffect(() => {
    if (!cursoId) {
      router.push('/profesor');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    cargarForos();
  }, [cursoId]);

  const cargarForos = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`${API_BASE_URL}/foros/curso/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error al cargar foros');
      
      const data = await res.json();
      setForos(data.foros || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los foros');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (foro = null) => {
    if (foro) {
      setModoEdicion(true);
      setForoSeleccionado(foro);
      setFormData({
        titulo: foro.titulo,
        descripcion: foro.descripcion,
        publico: foro.publico
      });
    } else {
      setModoEdicion(false);
      setForoSeleccionado(null);
      setFormData({
        titulo: '',
        descripcion: '',
        publico: false
      });
      setArchivos([]);
      setPrevisualizaciones([]);
    }
    setModalAbierto(true);
    setError('');
    setSuccess('');
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setForoSeleccionado(null);
    setFormData({
      titulo: '',
      descripcion: '',
      publico: false
    });
    setArchivos([]);
    setPrevisualizaciones([]);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArchivosChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + archivos.length > 5) {
      setError('Máximo 5 archivos permitidos');
      return;
    }

    setArchivos(prev => [...prev, ...files]);

    // Generar previsualizaciones
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrevisualizaciones(prev => [...prev, {
          file: file,
          url: reader.result,
          tipo: file.type,
          nombre: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const eliminarArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
    setPrevisualizaciones(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon size={18} className="text-[#00B9F0]" />;
    if (type.startsWith('video/')) return <Video size={18} className="text-[#FE327B]" />;
    if (type.includes('pdf')) return <FileText size={18} className="text-[#FA6D00]" />;
    return <File size={18} className="text-[#718096]" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');

    try {
      let res;
      
      if (modoEdicion) {
        // Para edición, enviar JSON sin archivos
        res = await fetch(`${API_BASE_URL}/foros/${foroSeleccionado._id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            titulo: formData.titulo.trim(),
            descripcion: formData.descripcion.trim(),
            publico: formData.publico
          })
        });
      } else {
        // Para creación, enviar FormData con archivos
        const formDataToSend = new FormData();
        formDataToSend.append('titulo', formData.titulo.trim());
        formDataToSend.append('descripcion', formData.descripcion.trim());
        formDataToSend.append('cursoId', cursoId);
        formDataToSend.append('publico', formData.publico);
        
        archivos.forEach(archivo => {
          formDataToSend.append('archivos', archivo);
        });

        res = await fetch(`${API_BASE_URL}/foros`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}` 
          },
          body: formDataToSend
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error al guardar el foro');
      }

      setSuccess(data.message || (modoEdicion ? 'Foro actualizado correctamente' : 'Foro creado correctamente'));
      
      setTimeout(() => {
        cerrarModal();
        cargarForos();
      }, 1500);
    } catch (error) {
      console.error('Error completo:', error);
      setError(error.message || 'Error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const cambiarEstadoForo = async (foroId, nuevoEstado) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/foros/${foroId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!res.ok) throw new Error('Error al cambiar el estado del foro');

      setSuccess(`Foro ${nuevoEstado === 'abierto' ? 'abierto' : 'cerrado'} correctamente`);
      cargarForos();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const eliminarForo = async (foroId) => {
    if (!confirm('¿Estás seguro de eliminar este foro? Esta acción no se puede deshacer.')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/foros/${foroId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al eliminar el foro');

      setSuccess('Foro eliminado correctamente');
      cargarForos();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const verForo = (foroId) => {
    router.push(`/profesor/cursos/informacion/foro/respuestas?cursoId=${cursoId}&foroId=${foroId}`);
  };

  const getEstadoBadge = (estado) => {
    if (estado === 'abierto') {
      return { 
        color: 'bg-[#7AD107]/10 text-[#7AD107] border border-[#7AD107]/20', 
        icon: Unlock, 
        texto: 'Abierto' 
      };
    }
    return { 
      color: 'bg-[#718096]/10 text-[#718096] border border-[#718096]/20', 
      icon: Lock, 
      texto: 'Cerrado' 
    };
  };

  const forosFiltrados = foros.filter(foro => {
    const cumpleBusqueda = foro.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                          foro.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleEstado = filtroEstado === 'todos' || foro.estado === filtroEstado;
    return cumpleBusqueda && cumpleEstado;
  });

  if (loading) {
    return <LoadingScreen mensaje="Cargando foros del curso..." />;
  }

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
                  <MessageCircle size={18} />
                </div>
                <h1 className="text-base sm:text-lg font-bold text-[#2D3748]">Foros del Curso</h1>
              </div>
              <span className="bg-[#00B9F0]/10 text-[#00B9F0] px-3 py-1 rounded-full text-sm font-semibold border border-[#00B9F0]/20">
                {foros.length}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.push('/profesor')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#E2E8F0] hover:bg-[#718096] text-[#2D3748] hover:text-white rounded-lg transition-all text-sm font-medium"
              >
                <Home size={16} />
                <span className="hidden sm:inline">Inicio</span>
              </button>
              <button
                onClick={() => router.push(`/profesor/cursos/informacion?cursoId=${cursoId}`)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all text-sm font-medium"
              >
                <BookOpen size={16} />
                <span className="hidden sm:inline">Ver Curso</span>
              </button>
              <button
                onClick={() => abrirModal()}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Crear Foro</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes globales */}
      {error && !modalAbierto && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="bg-[#FA6D00]/10 border-l-4 border-[#FA6D00] p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FA6D00] flex items-center justify-center text-white flex-shrink-0">
                <AlertCircle size={20} />
              </div>
              <p className="text-[#FA6D00] font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && !modalAbierto && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="bg-[#7AD107]/10 border-l-4 border-[#7AD107] p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#7AD107] flex items-center justify-center text-white flex-shrink-0">
                <CheckCircle size={20} />
              </div>
              <p className="text-[#7AD107] font-medium">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-[#00B9F0] flex items-center justify-center">
                  <Search className="text-white" size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar foros por título o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-14 pr-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748]"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setFiltroEstado('todos')}
                className={`px-4 py-2.5 rounded-lg font-semibold transition-all text-sm whitespace-nowrap ${
                  filtroEstado === 'todos'
                    ? 'bg-[#00B9F0] text-white shadow-md'
                    : 'bg-[#E2E8F0] text-[#718096] hover:bg-[#718096] hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroEstado('abierto')}
                className={`px-4 py-2.5 rounded-lg font-semibold transition-all text-sm whitespace-nowrap ${
                  filtroEstado === 'abierto'
                    ? 'bg-[#7AD107] text-white shadow-md'
                    : 'bg-[#E2E8F0] text-[#718096] hover:bg-[#7AD107] hover:text-white'
                }`}
              >
                Abiertos
              </button>
              <button
                onClick={() => setFiltroEstado('cerrado')}
                className={`px-4 py-2.5 rounded-lg font-semibold transition-all text-sm whitespace-nowrap ${
                  filtroEstado === 'cerrado'
                    ? 'bg-[#718096] text-white shadow-md'
                    : 'bg-[#E2E8F0] text-[#718096] hover:bg-[#718096] hover:text-white'
                }`}
              >
                Cerrados
              </button>
            </div>
          </div>
        </div>

        {/* Lista de foros */}
        {forosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-12 sm:p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="text-[#718096]" size={40} />
            </div>
            <p className="text-[#2D3748] text-lg font-medium mb-2">
              {busqueda || filtroEstado !== 'todos' ? 'No se encontraron foros' : 'No hay foros creados'}
            </p>
            <p className="text-[#718096] text-sm mb-6">
              {busqueda || filtroEstado !== 'todos' 
                ? 'Intenta con otros filtros de búsqueda' 
                : 'Crea tu primer foro para comenzar las discusiones'}
            </p>
            {!busqueda && filtroEstado === 'todos' && (
              <button
                onClick={() => abrirModal()}
                className="inline-flex items-center gap-2 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
              >
                <Plus size={20} />
                Crear Primer Foro
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {forosFiltrados.map((foro) => {
              const estadoBadge = getEstadoBadge(foro.estado);
              const IconoEstado = estadoBadge.icon;

              return (
                <div
                  key={foro._id}
                  className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6 hover:shadow-lg transition-all hover:border-[#00B9F0]/30"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-[#2D3748]">{foro.titulo}</h3>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${estadoBadge.color}`}>
                          <IconoEstado size={14} />
                          {estadoBadge.texto}
                        </span>
                        {foro.publico && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#01C9F4]/10 text-[#01C9F4] border border-[#01C9F4]/20 whitespace-nowrap">
                            Público
                          </span>
                        )}
                      </div>
                      <p className="text-[#718096] text-sm mb-4 leading-relaxed line-clamp-2">{foro.descripcion}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-[#F7FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0]">
                          <div className="w-6 h-6 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                            <Clock size={12} />
                          </div>
                          <span className="text-[#2D3748] font-medium">
                            {new Date(foro.fechaCreacion).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {foro.archivos && foro.archivos.length > 0 && (
                          <div className="flex items-center gap-2 bg-[#FE327B]/5 px-3 py-2 rounded-lg border border-[#FE327B]/20">
                            <div className="w-6 h-6 rounded-full bg-[#FE327B] flex items-center justify-center text-white">
                              <Paperclip size={12} />
                            </div>
                            <span className="text-[#FE327B] font-medium">
                              {foro.archivos.length} {foro.archivos.length === 1 ? 'archivo' : 'archivos'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => verForo(foro._id)}
                        className="flex-1 sm:flex-initial w-10 h-10 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all flex items-center justify-center"
                        title="Ver foro"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => abrirModal(foro)}
                        className="flex-1 sm:flex-initial w-10 h-10 bg-[#01C9F4] hover:bg-[#00B9F0] text-white rounded-lg transition-all flex items-center justify-center"
                        title="Editar foro"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => cambiarEstadoForo(foro._id, foro.estado === 'abierto' ? 'cerrado' : 'abierto')}
                        className={`flex-1 sm:flex-initial w-10 h-10 rounded-lg transition-all flex items-center justify-center ${
                          foro.estado === 'abierto'
                            ? 'bg-[#718096] hover:bg-[#718096]/90 text-white'
                            : 'bg-[#7AD107] hover:bg-[#7AD107]/90 text-white'
                        }`}
                        title={foro.estado === 'abierto' ? 'Cerrar foro' : 'Abrir foro'}
                      >
                        {foro.estado === 'abierto' ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                      <button
                        onClick={() => eliminarForo(foro._id)}
                        className="flex-1 sm:flex-initial w-10 h-10 bg-[#FA6D00] hover:bg-[#FA6D00]/90 text-white rounded-lg transition-all flex items-center justify-center"
                        title="Eliminar foro"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Foro */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#00B9F0] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle size={20} />
                  </div>
                  <h2 className="text-2xl font-bold">
                    {modoEdicion ? 'Editar Foro' : 'Crear Nuevo Foro'}
                  </h2>
                </div>
                <button
                  onClick={cerrarModal}
                  className="w-10 h-10 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Mensajes en modal */}
            {error && (
              <div className="mx-6 mt-6 bg-[#FA6D00]/10 border-l-4 border-[#FA6D00] p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-[#FA6D00]" size={20} />
                  <p className="text-[#FA6D00] font-medium text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mx-6 mt-6 bg-[#7AD107]/10 border-l-4 border-[#7AD107] p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-[#7AD107]" size={20} />
                  <p className="text-[#7AD107] font-medium text-sm">{success}</p>
                </div>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Título del Foro *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  placeholder="Ej: Discusión sobre el tema 1"
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748]"
                  required
                  maxLength={200}
                />
                <p className="text-xs text-[#718096] mt-1">
                  {formData.titulo.length}/200 caracteres
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Descripción *
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el tema del foro..."
                  rows={5}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748] resize-none"
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-[#718096] mt-1">
                  {formData.descripcion.length}/2000 caracteres
                </p>
              </div>

              {/* Público */}
              <div className="flex items-start gap-3 p-4 bg-[#01C9F4]/5 rounded-lg border border-[#01C9F4]/20">
                <input
                  type="checkbox"
                  name="publico"
                  id="publico"
                  checked={formData.publico}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#00B9F0] rounded focus:ring-[#00B9F0] mt-0.5 flex-shrink-0"
                />
                <label htmlFor="publico" className="text-sm text-[#2D3748] cursor-pointer">
                  <span className="font-semibold block mb-1">Foro público</span>
                  <p className="text-xs text-[#718096]">
                    Permitir que usuarios fuera del curso vean este foro
                  </p>
                </label>
              </div>

              {/* Archivos */}
              {!modoEdicion && (
                <div>
                  <label className="block text-sm font-semibold text-[#2D3748] mb-3">
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} className="text-[#00B9F0]" />
                      Archivos Adjuntos (Máximo 5)
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="archivos"
                      multiple
                      accept="image/*,video/*,application/pdf"
                      onChange={handleArchivosChange}
                      className="hidden"
                      disabled={archivos.length >= 5}
                    />
                    <label
                      htmlFor="archivos"
                      className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#00B9F0] hover:bg-[#00B9F0]/5 transition-all ${
                        archivos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full bg-[#00B9F0]/10 flex items-center justify-center mb-4">
                        <Upload className="text-[#00B9F0]" size={24} />
                      </div>
                      <p className="text-[#2D3748] font-semibold mb-1">
                        {archivos.length >= 5 
                          ? 'Límite de archivos alcanzado' 
                          : 'Haz clic para subir archivos'}
                      </p>
                      <p className="text-sm text-[#718096]">
                        Imágenes, videos (MP4) y PDFs hasta 10MB
                      </p>
                    </label>
                  </div>

                  {/* Previsualizaciones */}
                  {previsualizaciones.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#2D3748]">Archivos seleccionados:</p>
                        <span className="text-xs text-[#718096] bg-[#E2E8F0] px-3 py-1 rounded-full">
                          {previsualizaciones.length} / 5
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {previsualizaciones.map((prev, index) => (
                          <div
                            key={index}
                            className="relative group bg-[#F7FAFC] border border-[#E2E8F0] rounded-lg p-3 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {/* Previsualización */}
                              {prev.tipo.startsWith('image/') ? (
                                <div 
                                  className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity border-2 border-[#00B9F0]"
                                  onClick={() => setArchivoPrevisualizar(prev)}
                                  title="Click para ver en grande"
                                >
                                  <img
                                    src={prev.url}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : prev.tipo.startsWith('video/') ? (
                                <div 
                                  className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity border-2 border-[#FE327B]"
                                  onClick={() => setArchivoPrevisualizar(prev)}
                                  title="Click para ver video"
                                >
                                  <video
                                    src={prev.url}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-[#FA6D00]/10 flex items-center justify-center flex-shrink-0 border border-[#E2E8F0]">
                                  {getFileIcon(prev.tipo)}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#2D3748] text-sm truncate">
                                  {prev.nombre}
                                </p>
                                <p className="text-xs text-[#718096]">
                                  {(prev.file.size / 1024).toFixed(1)} KB
                                </p>
                                {(prev.tipo.startsWith('image/') || prev.tipo.startsWith('video/')) && (
                                  <button
                                    type="button"
                                    onClick={() => setArchivoPrevisualizar(prev)}
                                    className="mt-1 text-xs text-[#00B9F0] hover:text-[#01C9F4] font-medium flex items-center gap-1"
                                  >
                                    <Eye size={12} />
                                    Ver completo
                                  </button>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => eliminarArchivo(index)}
                                className="w-8 h-8 rounded-lg bg-[#FA6D00] hover:bg-[#FA6D00]/90 text-white flex items-center justify-center transition-all flex-shrink-0"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#E2E8F0] hover:bg-[#718096] text-[#2D3748] hover:text-white rounded-lg transition-all font-semibold"
                >
                  <X size={18} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      {modoEdicion ? 'Actualizar Foro' : 'Crear Foro'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de previsualización de archivos */}
      {archivoPrevisualizar && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" 
          onClick={() => setArchivoPrevisualizar(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-[#00B9F0] text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Vista Previa</h2>
                    <p className="text-sm text-white/90 truncate max-w-md">{archivoPrevisualizar.nombre}</p>
                  </div>
                </div>
                <button
                  onClick={() => setArchivoPrevisualizar(null)}
                  className="w-10 h-10 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 max-h-[70vh] overflow-auto">
              {archivoPrevisualizar.tipo.startsWith('image/') ? (
                <img
                  src={archivoPrevisualizar.url}
                  alt="Preview"
                  className="w-full h-auto rounded-lg"
                />
              ) : archivoPrevisualizar.tipo.startsWith('video/') ? (
                <video
                  src={archivoPrevisualizar.url}
                  controls
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center mb-4">
                    {getFileIcon(archivoPrevisualizar.tipo)}
                  </div>
                  <p className="text-[#718096] mb-2">No se puede previsualizar este tipo de archivo</p>
                  <p className="text-sm text-[#718096]">{archivoPrevisualizar.nombre}</p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="bg-[#F7FAFC] p-4 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setArchivoPrevisualizar(null)}
                className="px-6 py-2.5 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForoPage;