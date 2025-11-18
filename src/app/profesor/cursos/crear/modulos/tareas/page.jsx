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
  ClipboardList,
  Home,
  Eye,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
  FileVideo,
  Download,
  Plus,
  Paperclip,
  Target,
  Clock,
  UserCheck
} from 'lucide-react';

import LoadingScreen from '@/components/LoadingScreen';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-edumon.onrender.com';

const CrearTareaPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursoId = searchParams.get('cursoId');
  const tareaId = searchParams.get('tareaId');

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

  // Estados de previsualizaciones
  const [previsualizaciones, setPrevisualizaciones] = useState([]);
  const [archivoPrevisualizar, setArchivoPrevisualizar] = useState(null);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    if (!cursoId) {
      setError('No se especificó un curso');
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

      // Cargar participantes con fotos
      try {
        const participantesRes = await fetch(`${API_BASE_URL}/cursos/${cursoId}/participantes`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (participantesRes.ok) {
          const participantesData = await participantesRes.json();
          const participantesFormateados = participantesData.participantes || participantesData;
          
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

          setParticipantes(participantesMapeados);
        } else {
          setParticipantes(cursoCompleto.participantes || []);
        }
      } catch (error) {
        console.error('Error cargando participantes:', error);
        setParticipantes(cursoCompleto.participantes || []);
      }

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

          if (tareaData.archivosAdjuntos) {
            const enlacesExistentes = tareaData.archivosAdjuntos.filter(a => a.tipo === 'enlace');
            setEnlaces(enlacesExistentes);
          }
        }
      } else {
        setFormData(prev => ({ ...prev, cursoId }));
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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

    // Generar previsualizaciones
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrevisualizaciones(prev => [...prev, {
          file: file,
          url: reader.result,
          tipo: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const eliminarArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
    setPrevisualizaciones(prev => prev.filter((_, i) => i !== index));
  };

  const agregarEnlace = () => {
    if (!nuevoEnlace.url) {
      alert('Debes ingresar una URL');
      return;
    }
    setEnlaces(prev => [...prev, { ...nuevoEnlace, tipo: 'enlace' }]);
    setNuevoEnlace({ url: '', nombre: '', descripcion: '' });
  };

  const eliminarEnlace = (index) => {
    setEnlaces(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon size={18} className="text-[#00B9F0]" />;
    if (type.startsWith('video/')) return <FileVideo size={18} className="text-[#FE327B]" />;
    return <File size={18} className="text-[#718096]" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');

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
      setError('No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.');
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

      const formDataToSend = new FormData();
      
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

      formData.participantesSeleccionados.forEach(participanteId => {
        formDataToSend.append('participantesSeleccionados[]', participanteId);
      });

      formData.etiquetas.forEach(etiqueta => {
        formDataToSend.append('etiquetas[]', etiqueta);
      });

      archivos.forEach(archivo => {
        formDataToSend.append('archivos', archivo);
      });

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
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const erroresTexto = data.errors.map(err => err.msg || err.message).join(', ');
          throw new Error(erroresTexto);
        }
        throw new Error(data.message || 'Error al guardar la tarea');
      }

      setSuccess(`Tarea ${tareaId ? 'actualizada' : 'creada'} exitosamente`);
      
      setTimeout(() => {
        router.push(`/profesor/cursos/informacion?cursoId=${cursoId}`);
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen mensaje="Cargando formulario de tarea..." />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
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
                  <ClipboardList size={18} />
                </div>
                <h1 className="text-base sm:text-lg font-bold text-[#2D3748]">
                  {tareaId ? 'Editar Tarea' : 'Crear Nueva Tarea'}
                </h1>
              </div>
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
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Información del curso */}
        {curso && (
          <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#00B9F0] flex items-center justify-center text-white flex-shrink-0">
                <BookOpen size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#718096] mb-1">Curso:</p>
                <p className="font-bold text-[#2D3748] text-lg truncate">{curso.nombre}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensajes */}
        {error && (
          <div className="bg-[#FA6D00]/10 border-l-4 border-[#FA6D00] p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FA6D00] flex items-center justify-center text-white flex-shrink-0">
                <AlertCircle size={20} />
              </div>
              <p className="text-[#FA6D00] font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-[#7AD107]/10 border-l-4 border-[#7AD107] p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#7AD107] flex items-center justify-center text-white flex-shrink-0">
                <CheckCircle size={20} />
              </div>
              <p className="text-[#7AD107] font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#2D3748]">Información Básica</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Título de la tarea *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748] transition-all"
                  placeholder="Ej: Ensayo sobre la Revolución Industrial"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748] transition-all resize-none"
                  placeholder="Describe los objetivos y requisitos de la tarea..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-[#00B9F0]" />
                      Fecha de entrega *
                    </div>
                  </label>
                  <input
                    type="date"
                    name="fechaEntrega"
                    value={formData.fechaEntrega}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                    Tipo de entrega *
                  </label>
                  <select
                    name="tipoEntrega"
                    value={formData.tipoEntrega}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748] transition-all"
                    required
                  >
                    <option value="archivo">📄 Archivo</option>
                    <option value="texto">📝 Texto</option>
                    <option value="multimedia">🎬 Multimedia</option>
                    <option value="enlace">🔗 Enlace</option>
                    <option value="presencial">👥 Presencial</option>
                    <option value="grupal">👨‍👩‍👧‍👦 Grupal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-[#FE327B]" />
                    Módulo *
                  </div>
                </label>
                <select
                  name="moduloId"
                  value={formData.moduloId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748] transition-all"
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
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-[#7AD107]" />
                    Criterios de evaluación
                  </div>
                </label>
                <textarea
                  name="criterios"
                  value={formData.criterios}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748] transition-all resize-none"
                  placeholder="Describe cómo se evaluará esta tarea..."
                />
              </div>
            </div>
          </div>

          {/* Asignación */}
          <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#2D3748]">Asignación de Participantes</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-3">
                  Tipo de asignación
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-3 p-4 border-2 border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#00B9F0] transition-all flex-1">
                    <input
                      type="radio"
                      name="asignacionTipo"
                      value="todos"
                      checked={formData.asignacionTipo === 'todos'}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-[#00B9F0] focus:ring-[#00B9F0]"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-[#2D3748]">Todos los participantes</p>
                      <p className="text-xs text-[#718096]">Asignar a todos del curso</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#00B9F0] transition-all flex-1">
                    <input
                      type="radio"
                      name="asignacionTipo"
                      value="seleccionados"
                      checked={formData.asignacionTipo === 'seleccionados'}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-[#00B9F0] focus:ring-[#00B9F0]"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-[#2D3748]">Seleccionar específicos</p>
                      <p className="text-xs text-[#718096]">Elegir participantes</p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.asignacionTipo === 'seleccionados' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-[#2D3748] flex items-center gap-2">
                      <UserCheck size={16} className="text-[#00B9F0]" />
                      Selecciona participantes *
                    </label>
                    <span className="text-sm text-[#718096] bg-[#E2E8F0] px-3 py-1 rounded-full font-medium">
                      {formData.participantesSeleccionados.length} seleccionados
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto border border-[#E2E8F0] rounded-lg">
                    {participantes.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="mx-auto text-[#718096] mb-3" size={32} />
                        <p className="text-[#718096]">No hay participantes disponibles</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#E2E8F0]">
                        {participantes.map(participante => {
                          const participanteId = participante.usuarioId?._id || participante.usuarioId || participante._id;
                          const usuario = participante.usuarioId;
                          const avatarUrl = getAvatarUrl(usuario?.fotoPerfilUrl);
                          const isSelected = formData.participantesSeleccionados.includes(participanteId);

                          return (
                            <label
                              key={participanteId}
                              className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${
                                isSelected ? 'bg-[#00B9F0]/5' : 'hover:bg-[#F7FAFC]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleParticipanteToggle(participanteId)}
                                className="w-5 h-5 text-[#00B9F0] rounded focus:ring-[#00B9F0] border-[#E2E8F0]"
                              />
                              
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={usuario?.nombre}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-[#E2E8F0]"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              
                              <div
                                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center text-white font-bold text-lg"
                                style={{ display: avatarUrl ? 'none' : 'flex' }}
                              >
                                {(usuario?.nombre?.[0] || 'U').toUpperCase()}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#2D3748] truncate">
                                  {usuario?.nombre || 'Sin nombre'} {usuario?.apellido || ''}
                                </p>
                                <p className="text-sm text-[#718096] truncate">{usuario?.correo || 'Sin correo'}</p>
                              </div>

                              <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                                participante.etiqueta === 'docente' 
                                  ? 'bg-[#FE327B]/10 text-[#FE327B]'
                                  : 'bg-[#7AD107]/10 text-[#7AD107]'
                              }`}>
                                {participante.etiqueta || usuario?.rol || 'Sin rol'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Archivos adjuntos */}
          <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                <Paperclip size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#2D3748]">Archivos Adjuntos</h3>
            </div>

            <div className="space-y-6">
              {/* Subir archivos */}
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-3">
                  <div className="flex items-center gap-2">
                    <Upload size={16} className="text-[#00B9F0]" />
                    Subir archivos
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleArchivosChange}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#00B9F0] hover:bg-[#00B9F0]/5 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#00B9F0]/10 flex items-center justify-center mb-4">
                      <Upload className="text-[#00B9F0]" size={24} />
                    </div>
                    <p className="text-[#2D3748] font-semibold mb-1">Haz clic para subir archivos</p>
                    <p className="text-sm text-[#718096]">Imágenes, videos, PDFs y documentos</p>
                  </label>
                </div>

                {/* Lista de archivos subidos con previsualización */}
                {previsualizaciones.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#2D3748]">Archivos subidos:</p>
                      <span className="text-xs text-[#718096] bg-[#E2E8F0] px-3 py-1 rounded-full">
                        {previsualizaciones.length} archivo{previsualizaciones.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {previsualizaciones.map((prev, index) => (
                        <div
                          key={index}
                          className="relative group bg-[#F7FAFC] border border-[#E2E8F0] rounded-lg p-3 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {/* Previsualización de imagen o video */}
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
                              <div className="w-16 h-16 rounded-lg bg-[#00B9F0]/10 flex items-center justify-center flex-shrink-0 border border-[#E2E8F0]">
                                {getFileIcon(prev.tipo)}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#2D3748] text-sm truncate">
                                {prev.file.name}
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

              {/* Agregar enlaces */}
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon size={16} className="text-[#01C9F4]" />
                    Agregar enlaces externos
                  </div>
                </label>
                <div className="space-y-3 p-4 bg-[#F7FAFC] rounded-lg border border-[#E2E8F0]">
                  <input
                    type="url"
                    value={nuevoEnlace.url}
                    onChange={(e) => setNuevoEnlace({ ...nuevoEnlace, url: e.target.value })}
                    placeholder="https://ejemplo.com"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748]"
                  />
                  <input
                    type="text"
                    value={nuevoEnlace.nombre}
                    onChange={(e) => setNuevoEnlace({ ...nuevoEnlace, nombre: e.target.value })}
                    placeholder="Nombre del enlace"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-[#2D3748]"
                  />
                  <button
                    type="button"
                    onClick={agregarEnlace}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#01C9F4] hover:bg-[#00B9F0] text-white rounded-lg transition-all font-medium"
                  >
                    <Plus size={18} />
                    Agregar enlace
                  </button>
                </div>

                {/* Lista de enlaces agregados */}
                {enlaces.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {enlaces.map((enlace, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-[#01C9F4]/5 border border-[#01C9F4]/20 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#01C9F4] flex items-center justify-center text-white flex-shrink-0">
                          <ExternalLink size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#2D3748] text-sm truncate">
                            {enlace.nombre || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-[#718096] truncate">{enlace.url}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarEnlace(index)}
                          className="w-8 h-8 rounded-lg bg-[#FA6D00] hover:bg-[#FA6D00]/90 text-white flex items-center justify-center transition-all flex-shrink-0"
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

          {/* Botones de acción */}
          <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#E2E8F0] hover:bg-[#718096] text-[#2D3748] hover:text-white rounded-lg transition-all font-semibold"
              >
                <X size={20} />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </form>
      </div>

      {/* Modal de previsualización de archivos */}
      {archivoPrevisualizar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setArchivoPrevisualizar(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header del Modal */}
            <div className="bg-[#00B9F0] text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Vista Previa</h2>
                    <p className="text-sm text-white/90 truncate max-w-md">{archivoPrevisualizar.file.name}</p>
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
                  <p className="text-sm text-[#718096]">{archivoPrevisualizar.file.name}</p>
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

export default CrearTareaPage;