'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Power, 
  PowerOff, 
  Home, 
  Users, 
  Info,
  BookOpen,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';

const ModulosPage = () => {
  const [cursoId, setCursoId] = useState('');
  const [modulos, setModulos] = useState([]);
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: ''
  });
  const [errors, setErrors] = useState({});
  const [procesando, setProcesando] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);

  // Separar módulos por estado (excluyendo eliminados)
  const modulosActivos = modulos.filter(m => m.estado === 'activo' && !m.eliminado);
  const modulosInactivos = modulos.filter(m => m.estado === 'inactivo' && !m.eliminado);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('cursoId');
    
    if (!id) {
      alert('❌ No se especificó un curso');
      window.location.href = '/profesor';
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    setCursoId(id);
    cargarDatos(id);
  }, []);

  const cargarDatos = async (id) => {
    const token = localStorage.getItem('token');
    
    try {
      setLoading(true);

      // Cargar información del curso
      const cursoRes = await fetch(`${API_BASE_URL}/cursos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!cursoRes.ok) {
        throw new Error('No se pudo cargar la información del curso');
      }

      const cursoData = await cursoRes.json();
      setCurso(cursoData.curso || cursoData);

      // Cargar módulos del curso usando el endpoint específico
      // Agregar parámetro para incluir inactivos
      const modulosRes = await fetch(`${API_BASE_URL}/modulos/curso/${id}?incluirInactivos=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (modulosRes.ok) {
        const modulosData = await modulosRes.json();
        // Filtrar módulos que no estén eliminados (el backend maneja soft delete)
        const modulosNoEliminados = (modulosData.modulos || modulosData || []).filter(m => !m.eliminado);
        setModulos(modulosNoEliminados);
      } else {
        setModulos([]);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('❌ Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    } else if (formData.titulo.length < 3 || formData.titulo.length > 200) {
      newErrors.titulo = 'El título debe tener entre 3 y 200 caracteres';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    } else if (formData.descripcion.length < 10 || formData.descripcion.length > 1000) {
      newErrors.descripcion = 'La descripción debe tener entre 10 y 1000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNuevoModulo = () => {
    setEditando(null);
    setFormData({ titulo: '', descripcion: '' });
    setErrors({});
    setMostrarFormulario(true);
  };

  const handleEditarModulo = (modulo) => {
    setEditando(modulo._id);
    setFormData({
      titulo: modulo.titulo,
      descripcion: modulo.descripcion
    });
    setErrors({});
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setEditando(null);
    setFormData({ titulo: '', descripcion: '' });
    setErrors({});
  };

  const handleGuardar = async () => {
    if (!validateForm()) {
      return;
    }

    setProcesando(true);
    const token = localStorage.getItem('token');

    try {
      let res;
      
      if (editando) {
        res = await fetch(`${API_BASE_URL}/modulos/${editando}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/modulos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            cursoId,
            estado: 'activo'
          })
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar el módulo');
      }

      setModalConfirmacion({
        tipo: 'exito',
        titulo: '✅ Éxito',
        mensaje: `Módulo ${editando ? 'actualizado' : 'creado'} exitosamente`,
        accion: () => setModalConfirmacion(null)
      });

      handleCancelar();
      cargarDatos(cursoId);

    } catch (error) {
      console.error('Error guardando módulo:', error);
      setModalConfirmacion({
        tipo: 'error',
        titulo: '❌ Error',
        mensaje: error.message,
        accion: () => setModalConfirmacion(null)
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleCambiarEstado = async (moduloId, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
    
    setModalConfirmacion({
      tipo: 'advertencia',
      titulo: '⚠️ Confirmar acción',
      mensaje: `¿Seguro que deseas ${accion} este módulo?`,
      accion: async () => {
        setModalConfirmacion(null);
        setProcesando(true);
        const token = localStorage.getItem('token');

        try {
          const res = await fetch(`${API_BASE_URL}/modulos/${moduloId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error al cambiar el estado del módulo');
          }

          setModalConfirmacion({
            tipo: 'exito',
            titulo: '✅ Éxito',
            mensaje: `Módulo ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`,
            accion: () => setModalConfirmacion(null)
          });

          cargarDatos(cursoId);

        } catch (error) {
          console.error('Error cambiando estado:', error);
          setModalConfirmacion({
            tipo: 'error',
            titulo: '❌ Error',
            mensaje: error.message,
            accion: () => setModalConfirmacion(null)
          });
        } finally {
          setProcesando(false);
        }
      },
      cancelar: true
    });
  };

  const handleEliminar = async (moduloId) => {
    setModalConfirmacion({
      tipo: 'peligro',
      titulo: '🗑️ Eliminar módulo',
      mensaje: '¿Estás seguro de eliminar este módulo? Esta acción cambiará su estado a inactivo.',
      accion: async () => {
        setModalConfirmacion(null);
        setProcesando(true);
        const token = localStorage.getItem('token');

        try {
          const res = await fetch(`${API_BASE_URL}/modulos/${moduloId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error al eliminar el módulo');
          }

          setModalConfirmacion({
            tipo: 'exito',
            titulo: '✅ Eliminado',
            mensaje: 'Módulo eliminado exitosamente',
            accion: () => setModalConfirmacion(null)
          });

          cargarDatos(cursoId);

        } catch (error) {
          console.error('Error eliminando módulo:', error);
          setModalConfirmacion({
            tipo: 'error',
            titulo: '❌ Error',
            mensaje: error.message,
            accion: () => setModalConfirmacion(null)
          });
        } finally {
          setProcesando(false);
        }
      },
      cancelar: true
    });
  };

  const ModuloCard = ({ modulo, index }) => (
    <div
      className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-all ${
        modulo.estado === 'inactivo' ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
              modulo.estado === 'activo' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </span>
            <h3 className={`text-lg font-bold ${
              modulo.estado === 'activo' ? 'text-gray-800' : 'text-gray-500'
            }`}>
              {modulo.titulo}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                modulo.estado === 'activo'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {modulo.estado === 'activo' ? '✓ Activo' : '○ Inactivo'}
            </span>
          </div>
          <p className={`text-sm leading-relaxed ${
            modulo.estado === 'activo' ? 'text-gray-600' : 'text-gray-500'
          }`}>
            {modulo.descripcion}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Creado: {new Date(modulo.fechaCreacion).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleEditarModulo(modulo)}
            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
            title="Editar módulo"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleCambiarEstado(modulo._id, modulo.estado)}
            className={`p-2 rounded-lg transition-colors ${
              modulo.estado === 'activo'
                ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-600'
                : 'bg-green-100 hover:bg-green-200 text-green-600'
            }`}
            title={modulo.estado === 'activo' ? 'Desactivar' : 'Activar'}
          >
            {modulo.estado === 'activo' ? <PowerOff size={16} /> : <Power size={16} />}
          </button>
          <button
            onClick={() => handleEliminar(modulo._id)}
            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
            title="Eliminar módulo"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="font-medium text-sm">Volver</span>
              </button>
              <div className="h-5 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="text-blue-600" size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">
                    Módulos: {curso?.nombre || 'Cargando...'}
                  </h1>
                  <p className="text-xs text-gray-500">
                    Administración de contenidos educativos
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/profesor'}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              >
                <Home size={16} />
                <span className="hidden sm:inline">Inicio</span>
              </button>
              <button
                onClick={() => window.location.href = `/profesor/cursos/crear/registropadres?cursoId=${cursoId}`}
                className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors text-sm"
              >
                <Users size={16} />
                <span className="hidden sm:inline">Registrar Padres</span>
              </button>
              <button
                onClick={() => {
                  if (modulosActivos.length === 0) {
                    alert('⚠️ Debes tener al menos un módulo activo antes de ver la información del curso');
                    return;
                  }
                  window.location.href = `/profesor/cursos/informacion?cursoId=${cursoId}`;
                }}
                disabled={modulosActivos.length === 0}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  modulosActivos.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                }`}
                title={modulosActivos.length === 0 ? 'Debes tener al menos un módulo activo' : 'Ver información del curso'}
              >
                <Info size={16} />
                <span className="hidden sm:inline">Información</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Botón crear nuevo módulo */}
        {!mostrarFormulario && (
          <div className="mb-6">
            <button
              onClick={handleNuevoModulo}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              <Plus size={20} />
              Crear Nuevo Módulo
            </button>
          </div>
        )}

        {/* Formulario de creación/edición */}
        {mostrarFormulario && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editando ? '✏️ Editar Módulo' : '➕ Nuevo Módulo'}
              </h2>
              <button
                onClick={handleCancelar}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="titulo" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Título del Módulo <span className="text-red-500">*</span>
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  placeholder="Ej: Prevención de la Violencia Sexual"
                  maxLength={200}
                  className={`w-full border-2 ${
                    errors.titulo ? 'border-red-500' : 'border-gray-300'
                  } rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                />
                <div className="flex justify-between mt-1">
                  {errors.titulo ? (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.titulo}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-xs">Mínimo 3 caracteres</p>
                  )}
                  <p className="text-gray-400 text-xs">{formData.titulo.length}/200</p>
                </div>
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Descripción del Módulo <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el contenido y objetivos del módulo educativo..."
                  rows="5"
                  maxLength={1000}
                  className={`w-full border-2 ${
                    errors.descripcion ? 'border-red-500' : 'border-gray-300'
                  } rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition`}
                />
                <div className="flex justify-between mt-1">
                  {errors.descripcion ? (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.descripcion}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-xs">Mínimo 10 caracteres</p>
                  )}
                  <p className="text-gray-400 text-xs">{formData.descripcion.length}/1000</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGuardar}
                  disabled={procesando}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editando ? 'Actualizar Módulo' : 'Crear Módulo'}
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelar}
                  disabled={procesando}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de módulos */}
        {modulos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 text-lg font-medium mb-2">
              No hay módulos creados
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Crea tu primer módulo educativo para comenzar
            </p>
            <button
              onClick={handleNuevoModulo}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <Plus size={18} />
              Crear Módulo
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Módulos Activos */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-green-200"></div>
                <h2 className="text-lg font-bold text-green-700 flex items-center gap-2">
                  <Power size={20} />
                  Módulos Activos ({modulosActivos.length})
                </h2>
                <div className="flex-1 h-px bg-green-200"></div>
              </div>

              {modulosActivos.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle className="mx-auto text-green-400 mb-2" size={32} />
                  <p className="text-green-700 text-sm font-medium">
                    No hay módulos activos. Los módulos activos son visibles para los padres de familia.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {modulosActivos.map((modulo, index) => (
                    <ModuloCard key={modulo._id} modulo={modulo} index={index} />
                  ))}
                </div>
              )}
            </div>

            {/* Módulos Inactivos */}
            {modulosInactivos.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <h2 className="text-lg font-bold text-gray-600 flex items-center gap-2">
                    <PowerOff size={20} />
                    Módulos Inactivos ({modulosInactivos.length})
                  </h2>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div className="grid gap-4">
                  {modulosInactivos.map((modulo, index) => (
                    <ModuloCard key={modulo._id} modulo={modulo} index={index} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm text-blue-800 leading-relaxed">
                <span className="font-semibold">ℹ️ Información importante:</span>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-700">
                <li>• <strong>Activos:</strong> Visibles para los padres de familia</li>
                <li>• <strong>Inactivos:</strong> Ocultos temporalmente, se pueden reactivar con el botón de encendido</li>
                <li>• <strong>Eliminar:</strong> Cambia el módulo a estado inactivo (soft delete)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación con blur */}
      {modalConfirmacion && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => !modalConfirmacion.cancelar && setModalConfirmacion(null)}
        >
          <div
            className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <div className={`w-14 h-14 ${
                modalConfirmacion.tipo === 'peligro' ? 'bg-red-100' : 
                modalConfirmacion.tipo === 'exito' ? 'bg-green-100' : 
                modalConfirmacion.tipo === 'error' ? 'bg-red-100' :
                'bg-yellow-100'
              } rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                {modalConfirmacion.tipo === 'peligro' ? (
                  <Trash2 className="w-7 h-7 text-red-600" />
                ) : modalConfirmacion.tipo === 'exito' ? (
                  <CheckCircle className="w-7 h-7 text-green-600" />
                ) : modalConfirmacion.tipo === 'error' ? (
                  <AlertCircle className="w-7 h-7 text-red-600" />
                ) : (
                  <AlertCircle className="w-7 h-7 text-yellow-600" />
                )}
              </div>
              <h2 className="font-bold text-2xl text-gray-800 mb-3">{modalConfirmacion.titulo}</h2>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">{modalConfirmacion.mensaje}</p>
            </div>

            <div className="flex gap-3">
              {modalConfirmacion.cancelar ? (
                <>
                  <button
                    onClick={() => setModalConfirmacion(null)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={modalConfirmacion.accion}
                    className={`flex-1 px-4 py-3 ${
                      modalConfirmacion.tipo === 'peligro' 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    } text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all`}
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                <button
                  onClick={modalConfirmacion.accion || (() => setModalConfirmacion(null))}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Aceptar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ModulosPage;