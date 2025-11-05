'use client';

import React, { useState, useEffect } from 'react';
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
  Image,
  Video,
  FileText,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Search,
  Filter
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';

const ForoPage = () => {
  const [foros, setForos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [foroSeleccionado, setForoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    publico: false
  });
  const [archivos, setArchivos] = useState([]);
  const [previsualizaciones, setPrevisualizaciones] = useState([]);
  
  // Obtener cursoId de la URL
  const cursoId = new URLSearchParams(window.location.search).get('cursoId');

  useEffect(() => {
    if (cursoId) {
      cargarForos();
    }
  }, [cursoId]);

  const cargarForos = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/foros/curso/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error al cargar foros');
      
      const data = await res.json();
      setForos(data.foros || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar los foros');
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
      alert('Máximo 5 archivos permitidos');
      return;
    }

    const nuevasPrevis = files.map(file => {
      if (file.type.startsWith('image/')) {
        return { tipo: 'imagen', url: URL.createObjectURL(file), nombre: file.name };
      } else if (file.type.startsWith('video/')) {
        return { tipo: 'video', url: URL.createObjectURL(file), nombre: file.name };
      } else if (file.type === 'application/pdf') {
        return { tipo: 'pdf', url: URL.createObjectURL(file), nombre: file.name };
      }
      return null;
    }).filter(Boolean);

    setArchivos(prev => [...prev, ...files]);
    setPrevisualizaciones(prev => [...prev, ...nuevasPrevis]);
  };

  const eliminarArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
    setPrevisualizaciones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    
    formDataToSend.append('titulo', formData.titulo);
    formDataToSend.append('descripcion', formData.descripcion);
    formDataToSend.append('cursoId', cursoId);
    formDataToSend.append('publico', formData.publico);
    
    archivos.forEach(archivo => {
      formDataToSend.append('archivos', archivo);
    });

    try {
      const url = modoEdicion 
        ? `${API_BASE_URL}/foros/${foroSeleccionado._id}`
        : `${API_BASE_URL}/foros`;
      
      const res = await fetch(url, {
        method: modoEdicion ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al guardar el foro');
      }

      alert(modoEdicion ? 'Foro actualizado correctamente' : 'Foro creado correctamente');
      cerrarModal();
      cargarForos();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
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

      alert(`Foro ${nuevoEstado === 'abierto' ? 'abierto' : 'cerrado'} correctamente`);
      cargarForos();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
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

      alert('Foro eliminado correctamente');
      cargarForos();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  const verForo = (foroId) => {
    window.location.href = `/profesor/cursos/informacion/foro/respuestas?cursoId=${cursoId}&foroId=${foroId}`;
  };

  const getEstadoBadge = (estado) => {
    if (estado === 'abierto') {
      return { color: 'bg-green-100 text-green-700 border-green-200', icon: Unlock, texto: 'Abierto' };
    }
    return { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Lock, texto: 'Cerrado' };
  };

  const getIconoArchivo = (tipo) => {
    switch (tipo) {
      case 'imagen': return Image;
      case 'video': return Video;
      case 'pdf': return FileText;
      default: return File;
    }
  };

  const forosFiltrados = foros.filter(foro => {
    const cumpleBusqueda = foro.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                          foro.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleEstado = filtroEstado === 'todos' || foro.estado === filtroEstado;
    return cumpleBusqueda && cumpleEstado;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando foros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-purple-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-all"
              >
                <ArrowLeft size={20} />
                <span className="font-semibold text-sm">Volver</span>
              </button>
              <div className="h-6 w-px bg-purple-200"></div>
              <MessageCircle className="text-purple-600" size={24} />
              <h1 className="text-xl font-bold text-gray-800">Foros del Curso</h1>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                {foros.length}
              </span>
            </div>

            <button
              onClick={() => abrirModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
            >
              <Plus size={20} />
              Crear Foro
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar foros..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFiltroEstado('todos')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filtroEstado === 'todos'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroEstado('abierto')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filtroEstado === 'abierto'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Abiertos
              </button>
              <button
                onClick={() => setFiltroEstado('cerrado')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filtroEstado === 'cerrado'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cerrados
              </button>
            </div>
          </div>
        </div>

        {/* Lista de foros */}
        {forosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-16 text-center">
            <MessageCircle className="mx-auto text-gray-300 mb-6" size={64} />
            <p className="text-gray-600 text-lg font-medium mb-2">
              {busqueda || filtroEstado !== 'todos' ? 'No se encontraron foros' : 'No hay foros creados'}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {busqueda || filtroEstado !== 'todos' 
                ? 'Intenta con otros filtros de búsqueda' 
                : 'Crea tu primer foro para comenzar las discusiones'}
            </p>
            {!busqueda && filtroEstado === 'todos' && (
              <button
                onClick={() => abrirModal()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
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
                  className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-purple-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{foro.titulo}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${estadoBadge.color}`}>
                          <IconoEstado size={14} />
                          {estadoBadge.texto}
                        </span>
                        {foro.publico && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            Público
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{foro.descripcion}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                          <Clock className="text-gray-500" size={16} />
                          <span className="text-gray-700">
                            {new Date(foro.fechaCreacion).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        {foro.archivos && foro.archivos.length > 0 && (
                          <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                            <File className="text-purple-600" size={16} />
                            <span className="text-purple-700 font-medium">
                              {foro.archivos.length} {foro.archivos.length === 1 ? 'archivo' : 'archivos'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => verForo(foro._id)}
                        className="p-2.5 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-all hover:scale-105"
                        title="Ver foro"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => abrirModal(foro)}
                        className="p-2.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all hover:scale-105"
                        title="Editar foro"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => cambiarEstadoForo(foro._id, foro.estado === 'abierto' ? 'cerrado' : 'abierto')}
                        className={`p-2.5 rounded-lg transition-all hover:scale-105 ${
                          foro.estado === 'abierto'
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            : 'bg-green-100 hover:bg-green-200 text-green-600'
                        }`}
                        title={foro.estado === 'abierto' ? 'Cerrar foro' : 'Abrir foro'}
                      >
                        {foro.estado === 'abierto' ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                      <button
                        onClick={() => eliminarForo(foro._id)}
                        className="p-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all hover:scale-105"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle size={28} />
                  <h2 className="text-2xl font-bold">
                    {modoEdicion ? 'Editar Foro' : 'Crear Nuevo Foro'}
                  </h2>
                </div>
                <button
                  onClick={cerrarModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título del Foro *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  placeholder="Ej: Discusión sobre el tema 1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.titulo.length}/200 caracteres
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el tema del foro..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.descripcion.length}/2000 caracteres
                </p>
              </div>

              {/* Público */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  name="publico"
                  id="publico"
                  checked={formData.publico}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="publico" className="text-sm text-gray-700">
                  <span className="font-semibold">Foro público</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Permitir que usuarios fuera del curso vean este foro
                  </p>
                </label>
              </div>

              {/* Archivos */}
              {!modoEdicion && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Archivos Adjuntos (Máximo 5)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-all">
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
                      className={`cursor-pointer ${archivos.length >= 5 ? 'opacity-50' : ''}`}
                    >
                      <Upload className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-600 font-medium mb-1">
                        {archivos.length >= 5 
                          ? 'Límite de archivos alcanzado' 
                          : 'Haz clic para subir archivos'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Imágenes, videos (MP4) y PDFs hasta 10MB
                      </p>
                    </label>
                  </div>

                  {/* Previsualizaciones */}
                  {previsualizaciones.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {previsualizaciones.map((prev, index) => {
                        const IconoTipo = getIconoArchivo(prev.tipo);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              <IconoTipo className="text-purple-600" size={20} />
                              <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                {prev.nombre}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => eliminarArchivo(index)}
                              className="p-1 hover:bg-red-100 text-red-600 rounded transition-all"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                >
                  {modoEdicion ? 'Actualizar Foro' : 'Crear Foro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForoPage;