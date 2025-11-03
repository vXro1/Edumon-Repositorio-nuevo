'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  X,
  Calendar,
  BookOpen,
  Users,
  Upload,
  ExternalLink,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileText,
  ClipboardList
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';

const CrearTareaPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursoId = searchParams.get('cursoId');
  const tareaId = searchParams.get('tareaId'); // Para edición

  // Estados del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaEntrega: '',
    tipoEntrega: 'archivo',
    criterios: '',
    cursoId: '',
    moduloId: '',
    asignacionTipo: 'todos',
    participantesSeleccionados: [],
    etiquetas: []
  });

  // Estados de datos relacionados
  const [curso, setCurso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  
  // Estados de archivos y enlaces
  const [archivos, setArchivos] = useState([]);
  const [enlaces, setEnlaces] = useState([]);
  const [nuevoEnlace, setNuevoEnlace] = useState({ url: '', nombre: '', descripcion: '' });

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    if (!cursoId) {
      setError('❌ No se especificó un curso');
      router.push('/profesor');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    cargarDatosIniciales();
  }, [cursoId, tareaId]);

  const cargarDatosIniciales = async () => {
    const token = localStorage.getItem('token');
    
    try {
      setLoading(true);
      setError('');

      // 1. Cargar información del curso
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

      // 2. Cargar módulos del curso
      const modulosRes = await fetch(`${API_BASE_URL}/modulos?cursoId=${cursoId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (modulosRes.ok) {
        const modulosData = await modulosRes.json();
        setModulos(modulosData.modulos || []);
      }

      // 3. Si es edición, cargar la tarea
      if (tareaId) {
        const tareaRes = await fetch(`${API_BASE_URL}/tareas/${tareaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (tareaRes.ok) {
          const tareaData = await tareaRes.json();
          setFormData({
            titulo: tareaData.titulo || '',
            descripcion: tareaData.descripcion || '',
            fechaEntrega: tareaData.fechaEntrega?.split('T')[0] || '',
            tipoEntrega: tareaData.tipoEntrega || 'archivo',
            criterios: tareaData.criterios || '',
            cursoId: tareaData.cursoId?._id || cursoId,
            moduloId: tareaData.moduloId?._id || '',
            asignacionTipo: tareaData.asignacionTipo || 'todos',
            participantesSeleccionados: tareaData.participantesSeleccionados?.map(p => p._id) || [],
            etiquetas: tareaData.etiquetas || []
          });

          // Cargar archivos adjuntos existentes
          if (tareaData.archivosAdjuntos) {
            const archivosExistentes = tareaData.archivosAdjuntos.filter(a => a.tipo === 'archivo');
            const enlacesExistentes = tareaData.archivosAdjuntos.filter(a => a.tipo === 'enlace');
            setEnlaces(enlacesExistentes);
          }
        }
      } else {
        // Establecer cursoId en el formulario para nuevas tareas
        setFormData(prev => ({ ...prev, cursoId }));
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Si cambia a "todos", limpiar participantes seleccionados
    if (name === 'asignacionTipo' && value === 'todos') {
      setFormData(prev => ({ ...prev, participantesSeleccionados: [] }));
    }
  };

  const handleParticipanteToggle = (participanteId) => {
    setFormData(prev => {
      const seleccionados = prev.participantesSeleccionados.includes(participanteId)
        ? prev.participantesSeleccionados.filter(id => id !== participanteId)
        : [...prev.participantesSeleccionados, participanteId];
      
      return { ...prev, participantesSeleccionados: seleccionados };
    });
  };

  const handleArchivosChange = (e) => {
    const files = Array.from(e.target.files);
    setArchivos(prev => [...prev, ...files]);
  };

  const eliminarArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const agregarEnlace = () => {
    if (!nuevoEnlace.url) {
      alert('❌ Debes ingresar una URL');
      return;
    }
    setEnlaces(prev => [...prev, { ...nuevoEnlace }]);
    setNuevoEnlace({ url: '', nombre: '', descripcion: '' });
  };

  const eliminarEnlace = (index) => {
    setEnlaces(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');

    // Función para decodificar el token JWT y obtener el userId
    const getUserIdFromToken = (token) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        return payload.userId || payload.id || payload.sub;
      } catch (error) {
        console.error('Error decodificando token:', error);
        return null;
      }
    };

    const userId = getUserIdFromToken(token);

    if (!userId) {
      setError('❌ No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.');
      setSubmitting(false);
      return;
    }

    try {
      // Validaciones
      if (!formData.titulo.trim()) {
        throw new Error('El título es obligatorio');
      }
      if (!formData.fechaEntrega) {
        throw new Error('La fecha de entrega es obligatoria');
      }
      if (!formData.moduloId) {
        throw new Error('Debes seleccionar un módulo');
      }
      if (formData.asignacionTipo === 'seleccionados' && formData.participantesSeleccionados.length === 0) {
        throw new Error('Debes seleccionar al menos un participante');
      }

      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      
      // Datos básicos
      formDataToSend.append('titulo', formData.titulo.trim());
      formDataToSend.append('descripcion', formData.descripcion.trim());
      formDataToSend.append('fechaEntrega', new Date(formData.fechaEntrega).toISOString());
      formDataToSend.append('tipoEntrega', formData.tipoEntrega);
      formDataToSend.append('criterios', formData.criterios.trim());
      formDataToSend.append('cursoId', formData.cursoId);
      formDataToSend.append('moduloId', formData.moduloId);
      formDataToSend.append('docenteId', userId);
      formDataToSend.append('asignacionTipo', formData.asignacionTipo);
      formDataToSend.append('estado', 'publicada');

      // Participantes seleccionados (como array individual)
      formData.participantesSeleccionados.forEach(participanteId => {
        formDataToSend.append('participantesSeleccionados[]', participanteId);
      });

      // Etiquetas (como array individual)
      formData.etiquetas.forEach(etiqueta => {
        formDataToSend.append('etiquetas[]', etiqueta);
      });

      // Archivos
      archivos.forEach(archivo => {
        formDataToSend.append('archivos', archivo);
      });

      // Enlaces
      if (enlaces.length > 0) {
        formDataToSend.append('enlaces', JSON.stringify(enlaces));
      }

      const url = tareaId 
        ? `${API_BASE_URL}/tareas/${tareaId}`
        : `${API_BASE_URL}/tareas`;
      
      const method = tareaId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
          // NO incluir 'Content-Type', el navegador lo establece automáticamente con boundary
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostrar errores de validación si existen
        if (data.errors && Array.isArray(data.errors)) {
          const erroresTexto = data.errors.map(err => err.msg || err.message).join(', ');
          throw new Error(erroresTexto);
        }
        throw new Error(data.message || 'Error al guardar la tarea');
      }

      setSuccess(`✅ Tarea ${tareaId ? 'actualizada' : 'creada'} exitosamente`);
      
      setTimeout(() => {
        router.push(`/profesor/cursos/informacion?cursoId=${cursoId}`);
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setError('❌ ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-indigo-100">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-all"
              >
                <ArrowLeft size={20} />
                <span className="font-semibold">Volver</span>
              </button>
              <div className="h-6 w-px bg-indigo-200"></div>
              <ClipboardList className="text-indigo-600" size={24} />
              <h1 className="text-xl font-bold text-gray-800">
                {tareaId ? 'Editar Tarea' : 'Crear Nueva Tarea'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Información del curso */}
        {curso && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="text-indigo-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Curso:</p>
                <p className="font-bold text-gray-800 text-lg">{curso.nombre}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              Información Básica
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título de la tarea *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: Ensayo sobre la Revolución Industrial"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe los objetivos y requisitos de la tarea..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de entrega *
                  </label>
                  <input
                    type="date"
                    name="fechaEntrega"
                    value={formData.fechaEntrega}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de entrega *
                  </label>
                  <select
                    name="tipoEntrega"
                    value={formData.tipoEntrega}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="archivo">Archivo</option>
                    <option value="texto">Texto</option>
                    <option value="multimedia">Multimedia</option>
                    <option value="enlace">Enlace</option>
                    <option value="presencial">Presencial</option>
                    <option value="grupal">Grupal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Módulo *
                </label>
                <select
                  name="moduloId"
                  value={formData.moduloId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona un módulo</option>
                  {modulos.map(modulo => (
                    <option key={modulo._id} value={modulo._id}>
                      {modulo.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Criterios de evaluación
                </label>
                <textarea
                  name="criterios"
                  value={formData.criterios}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe cómo se evaluará esta tarea..."
                />
              </div>
            </div>
          </div>

          {/* Asignación */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="text-indigo-600" size={20} />
              Asignación de Participantes
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Tipo de asignación
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="asignacionTipo"
                      value="todos"
                      checked={formData.asignacionTipo === 'todos'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-gray-700">Todos los participantes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="asignacionTipo"
                      value="seleccionados"
                      checked={formData.asignacionTipo === 'seleccionados'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-gray-700">Seleccionar específicos</span>
                  </label>
                </div>
              </div>

              {formData.asignacionTipo === 'seleccionados' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Selecciona participantes *
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                    {participantes.map(participante => {
                      const participanteId = participante.usuarioId?._id || participante.usuarioId || participante._id;
                      return (
                      <label
                        key={participanteId}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.participantesSeleccionados.includes(participanteId)}
                          onChange={() => handleParticipanteToggle(participanteId)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {participante.usuarioId?.nombre} {participante.usuarioId?.apellido}
                          </p>
                          <p className="text-xs text-gray-600">{participante.usuarioId?.correo}</p>
                        </div>
                      </label>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Seleccionados: {formData.participantesSeleccionados.length}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Archivos adjuntos */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="text-indigo-600" size={20} />
              Archivos Adjuntos
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subir archivos
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleArchivosChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
                {archivos.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {archivos.map((archivo, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{archivo.name}</span>
                        <button
                          type="button"
                          onClick={() => eliminarArchivo(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Agregar enlaces
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={nuevoEnlace.url}
                    onChange={(e) => setNuevoEnlace({ ...nuevoEnlace, url: e.target.value })}
                    placeholder="URL del enlace"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={nuevoEnlace.nombre}
                    onChange={(e) => setNuevoEnlace({ ...nuevoEnlace, nombre: e.target.value })}
                    placeholder="Nombre del enlace"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={agregarEnlace}
                    className="w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Agregar enlace
                  </button>
                </div>

                {enlaces.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {enlaces.map((enlace, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{enlace.nombre || 'Sin nombre'}</p>
                          <p className="text-xs text-gray-600">{enlace.url}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarEnlace(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  {tareaId ? 'Actualizar Tarea' : 'Crear Tarea'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearTareaPage;