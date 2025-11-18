'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { 
  Plus, Edit2, LogOut, BookOpen, Trash2, X, Upload, Loader2, 
  Users, User, Camera, CheckCircle2, AlertCircle, Save, 
  Calendar, FileText, MessageSquare, Settings
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-edumon.onrender.com';

import LoadingScreen from '@/components/LoadingScreen'; // Ajusta la ruta según tu estructura


const ProfesorPage = () => {
  const router = useRouter();
  const [profesorNombre, setProfesorNombre] = useState('');
  const [usuarioData, setUsuarioData] = useState(null);
  const [grados, setGrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [cursoEditando, setCursoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [error, setError] = useState('');
  const [exitoMensaje, setExitoMensaje] = useState('');
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', imagen: null });
  const [perfilData, setPerfilData] = useState({ nombre: '', apellido: '', telefono: '', foto: null });
  const [preview, setPreview] = useState(null);
  const [perfilPreview, setPerfilPreview] = useState(null);
  const [imagenCambiada, setImagenCambiada] = useState(false);
  const [fotoCambiada, setFotoCambiada] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      let userData = null;
      
      if (userStr) {
        try {
          userData = JSON.parse(userStr);
        } catch (e) {
          console.error('Error parseando user:', e);
        }
      }
      
      const docenteId = decoded.id || decoded._id || decoded.userId || userData?._id || userData?.id;
      const nombre = userData?.nombre || decoded.nombre || localStorage.getItem('nombre') || 'Profesor';
      
      setProfesorNombre(nombre);
      setUsuarioData(userData);
      
      fetchPerfil(token);
      fetchCursos(docenteId, token);
      
    } catch (error) {
      console.error('Error decodificando token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth/login');
    }

    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      if (perfilPreview && perfilPreview.startsWith('blob:')) URL.revokeObjectURL(perfilPreview);
    };
  }, [router]);

  const mostrarError = (mensaje) => {
    setError(mensaje);
    setTimeout(() => setError(''), 5000);
  };

  const mostrarExito = (mensaje) => {
    setExitoMensaje(mensaje);
    setTimeout(() => setExitoMensaje(''), 3000);
  };

  const fetchPerfil = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error al obtener perfil');

      const data = await res.json();
      const usuario = data.usuario || data;
      
      setUsuarioData(usuario);
      setProfesorNombre(usuario.nombre || 'Profesor');
      localStorage.setItem('user', JSON.stringify(usuario));
      if (usuario.nombre) localStorage.setItem('nombre', usuario.nombre);
      
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const fetchCursos = async (docenteId, token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cursos/mis-cursos?docenteId=${docenteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Error al obtener cursos');

      const data = await res.json();
      setGrados(data.cursos || []);
    } catch (error) {
      console.error('Error cargando cursos:', error);
      mostrarError('No se pudieron cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=400&fit=crop';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const getFotoPerfilUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const handleCrearCurso = () => {
    router.push('/profesor/cursos/crear');
  };

  const handleClickCurso = async (cursoId) => {
    const token = localStorage.getItem('token');
    
    try {
      const cursoRes = await fetch(`${API_BASE_URL}/cursos/${cursoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!cursoRes.ok) throw new Error('Error al obtener información del curso');

      const cursoData = await cursoRes.json();
      const curso = cursoData.curso || cursoData;
      
      let padres = [];
      if (curso.participantes && Array.isArray(curso.participantes)) {
        padres = curso.participantes.filter(participante => {
          const etiqueta = participante.etiqueta?.toLowerCase();
          return etiqueta === 'padre' || etiqueta === 'padres';
        });
      }
      
      const tienePadres = padres.length > 0;
      let tieneModulos = false;
      
      try {
        const modulosRes = await fetch(`${API_BASE_URL}/modulos/curso/${cursoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (modulosRes.ok) {
          const modulosData = await modulosRes.json();
          const modulos = modulosData.modulos || modulosData;
          if (Array.isArray(modulos)) tieneModulos = modulos.length > 0;
        }
      } catch (error) {
        console.error('Error al verificar módulos:', error);
      }

      let rutaDestino = '';

      if (!tienePadres) {
        rutaDestino = `/profesor/cursos/crear/registropadres?cursoId=${cursoId}`;
      } else if (!tieneModulos) {
        rutaDestino = `/profesor/cursos/crear/modulos?cursoId=${cursoId}`;
      } else {
        rutaDestino = `/profesor/cursos/informacion?cursoId=${cursoId}`;
      }

      router.push(rutaDestino);

    } catch (error) {
      console.error('Error en validación:', error);
      mostrarError('Error al verificar el curso');
      router.push(`/profesor/cursos/crear/registropadres?cursoId=${cursoId}`);
    }
  };

  const handleAbrirPerfil = () => {
    if (!usuarioData) return;
    
    setPerfilData({
      nombre: usuarioData.nombre || '',
      apellido: usuarioData.apellido || '',
      telefono: usuarioData.telefono || '',
      foto: null
    });
    setPerfilPreview(usuarioData.fotoPerfilUrl ? getFotoPerfilUrl(usuarioData.fotoPerfilUrl) : null);
    setFotoCambiada(false);
    setModalPerfil(true);
  };

  const handleEditar = (e, curso) => {
    e.stopPropagation();
    setCursoEditando(curso);
    setFormData({
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      imagen: null,
    });
    setPreview(curso.fotoPortadaUrl ? getImageUrl(curso.fotoPortadaUrl) : null);
    setImagenCambiada(false);
    setModalEditar(true);
  };

  const handleCerrarModal = () => {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setModalEditar(false);
    setCursoEditando(null);
    setFormData({ nombre: '', descripcion: '', imagen: null });
    setPreview(null);
    setImagenCambiada(false);
  };

  const handleCerrarModalPerfil = () => {
    if (perfilPreview && perfilPreview.startsWith('blob:')) URL.revokeObjectURL(perfilPreview);
    setModalPerfil(false);
    setPerfilData({ nombre: '', apellido: '', telefono: '', foto: null });
    setPerfilPreview(null);
    setFotoCambiada(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePerfilInputChange = (e) => {
    const { name, value } = e.target;
    setPerfilData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        mostrarError('Por favor selecciona una imagen válida');
        e.target.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        mostrarError('La imagen no debe superar los 5MB');
        e.target.value = '';
        return;
      }

      setFormData((prev) => ({ ...prev, imagen: file }));
      setImagenCambiada(true);
      
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleFotoPerfilChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        mostrarError('Por favor selecciona una imagen válida');
        e.target.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        mostrarError('La imagen no debe superar los 5MB');
        e.target.value = '';
        return;
      }

      setPerfilData((prev) => ({ ...prev, foto: file }));
      setFotoCambiada(true);
      
      if (perfilPreview && perfilPreview.startsWith('blob:')) URL.revokeObjectURL(perfilPreview);
      setPerfilPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFormData((prev) => ({ ...prev, imagen: null }));
    setPreview(null);
    setImagenCambiada(true);
  };

  const handleRemoveFotoPerfil = () => {
    if (perfilPreview && perfilPreview.startsWith('blob:')) URL.revokeObjectURL(perfilPreview);
    setPerfilData((prev) => ({ ...prev, foto: null }));
    setPerfilPreview(null);
    setFotoCambiada(true);
  };

  const handleGuardarPerfil = async () => {
    if (!perfilData.nombre.trim()) {
      mostrarError('El nombre es requerido');
      return;
    }

    setGuardando(true);
    const token = localStorage.getItem("token");

    if (!token) {
      mostrarError('Sesión expirada');
      router.push('/auth/login');
      return;
    }

    try {
      const updateData = {
        nombre: perfilData.nombre.trim(),
        apellido: perfilData.apellido.trim(),
        telefono: perfilData.telefono.trim()
      };

      const resUsuario = await fetch(`${API_BASE_URL}/users/${usuarioData._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!resUsuario.ok) {
        const errorData = await resUsuario.json();
        throw new Error(errorData.message || 'Error al actualizar datos');
      }

      const datosActualizados = await resUsuario.json();
      const usuarioActualizado = datosActualizados.usuario || datosActualizados;

      if (fotoCambiada && perfilData.foto instanceof File) {
        const formDataFoto = new FormData();
        formDataFoto.append('foto', perfilData.foto);

        const resFoto = await fetch(`${API_BASE_URL}/users/me/foto-perfil`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataFoto
        });

        if (resFoto.ok) {
          const dataFoto = await resFoto.json();
          usuarioActualizado.fotoPerfilUrl = dataFoto.usuario?.fotoPerfilUrl || dataFoto.fotoPerfilUrl;
        }
      }

      setUsuarioData(usuarioActualizado);
      setProfesorNombre(usuarioActualizado.nombre);
      localStorage.setItem('user', JSON.stringify(usuarioActualizado));
      localStorage.setItem('nombre', usuarioActualizado.nombre);

      mostrarExito('Perfil actualizado correctamente');
      handleCerrarModalPerfil();

    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      mostrarError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim() || !formData.descripcion.trim()) {
      mostrarError('El nombre y la descripción son requeridos');
      return;
    }

    if (!cursoEditando) {
      mostrarError('No se ha seleccionado un curso para editar');
      return;
    }

    setGuardando(true);
    const token = localStorage.getItem("token");

    if (!token) {
      mostrarError('Sesión expirada');
      router.push('/auth/login');
      return;
    }

    try {
      const dataToSend = new FormData();
      dataToSend.append("nombre", formData.nombre.trim());
      dataToSend.append("descripcion", formData.descripcion.trim());

      if (imagenCambiada && formData.imagen instanceof File) {
        dataToSend.append("fotoPortada", formData.imagen);
      }

      const res = await fetch(`${API_BASE_URL}/cursos/${cursoEditando._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: dataToSend,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          mostrarError('Sesión expirada');
          router.push('/auth/login');
          return;
        }

        const errorMessage = errorData?.message || errorData?.error || `Error del servidor`;
        throw new Error(errorMessage);
      }

      const responseData = await res.json();
      const cursoActualizado = responseData.curso || responseData;
      
      setGrados((prev) =>
        prev.map((curso) => 
          curso._id === cursoEditando._id 
            ? { 
                ...curso, 
                nombre: cursoActualizado.nombre || formData.nombre,
                descripcion: cursoActualizado.descripcion || formData.descripcion,
                fotoPortadaUrl: cursoActualizado.fotoPortadaUrl || curso.fotoPortadaUrl
              } 
            : curso
        )
      );

      mostrarExito('Curso actualizado correctamente');
      handleCerrarModal();

    } catch (error) {
      console.error("Error al actualizar curso:", error);
      mostrarError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (e, id) => {
    e.stopPropagation();
    
    const confirmar = confirm('¿Estás seguro de eliminar este curso?\n\nEsta acción no se puede deshacer y eliminará todos los módulos, tareas y participantes del curso');
    if (!confirmar) return;

    setEliminando(id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/cursos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar curso');
      }

      setGrados((prev) => prev.filter((curso) => curso._id !== id));
      mostrarExito('Curso eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando curso:', error);
      mostrarError(`No se pudo eliminar el curso: ${error.message}`);
    } finally {
      setEliminando(null);
    }
  };

  if (loading) {
    return <LoadingScreen mensaje="Cargando tus cursos..." />;
  }

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
      <header className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleAbrirPerfil}
                className="relative group"
              >
                {getFotoPerfilUrl(usuarioData?.fotoPerfilUrl) ? (
                  <img 
                    src={getFotoPerfilUrl(usuarioData?.fotoPerfilUrl)} 
                    alt="Perfil"
                    className="w-16 h-16 rounded-full object-cover border-3 border-[#00B9F0] transition-all group-hover:border-[#01C9F4]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center text-white font-bold text-xl border-3 border-[#00B9F0]">
                    {profesorNombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white" size={20} />
                </div>
              </button>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#2D3748]">
                  Hola, {profesorNombre}
                </h1>
                <p className="text-sm sm:text-base text-[#718096] mt-1">
                  Gestiona tus cursos y contenido educativo
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleAbrirPerfil}
                className="w-10 h-10 bg-[#718096] hover:bg-[#2D3748] rounded-lg transition-all flex items-center justify-center"
                title="Mi Perfil"
              >
                <User size={20} className="text-white" />
              </button>
              <button
                onClick={handleCrearCurso}
                className="flex items-center gap-2 px-4 py-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
              >
                <Plus size={20} className="text-white" />
                <span className="hidden sm:inline">Nuevo Curso</span>
              </button>
              <button
                onClick={handleCerrarSesion}
                className="w-10 h-10 bg-[#FA6D00] hover:bg-[#FA6D00]/90 rounded-lg transition-all flex items-center justify-center"
                title="Cerrar Sesión"
              >
                <LogOut size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Lista de cursos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center">
            <BookOpen className="text-white" size={20} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3748]">
            Mis Cursos
          </h2>
          <span className="bg-[#00B9F0]/10 text-[#00B9F0] px-3 py-1 rounded-full text-sm font-semibold border border-[#00B9F0]/20">
            {grados.length}
          </span>
        </div>

        {grados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-[#E2E8F0]">
            <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-6">
              <BookOpen className="text-[#718096]" size={40} />
            </div>
            <p className="text-xl font-medium text-[#2D3748] mb-2">No tienes cursos registrados</p>
            <p className="text-sm text-[#718096] mb-6">Comienza creando tu primer curso</p>
            <button
              onClick={handleCrearCurso}
              className="inline-flex items-center gap-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
            >
              <Plus size={20} className="text-white" />
              Crear Primer Curso
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {grados.map((curso) => (
              <div
                key={curso._id}
                onClick={() => handleClickCurso(curso._id)}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#E2E8F0] cursor-pointer group"
              >
                <div className="relative h-48">
                  <img
                    src={getImageUrl(curso.fotoPortadaUrl)}
                    alt={curso.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=400&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={(e) => handleEditar(e, curso)}
                      className="w-10 h-10 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center"
                      title="Editar curso"
                    >
                      <Edit2 size={18} className="text-[#00B9F0]" />
                    </button>
                    <button
                      onClick={(e) => handleEliminar(e, curso._id)}
                      disabled={eliminando === curso._id}
                      className="w-10 h-10 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center disabled:opacity-50"
                      title="Eliminar curso"
                    >
                      {eliminando === curso._id ? (
                        <Loader2 className="animate-spin text-[#FA6D00]" size={18} />
                      ) : (
                        <Trash2 size={18} className="text-[#FA6D00]" />
                      )}
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-xl font-bold text-white line-clamp-1 drop-shadow-lg">
                      {curso.nombre}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-[#718096] mb-4 line-clamp-2 min-h-[40px]">
                    {curso.descripcion}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#00B9F0] flex items-center justify-center">
                        <Users size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold text-[#2D3748]">
                        {curso.participantes?.length || 0} participantes
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#7AD107] text-white">
                      {curso.estado || 'activo'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de Edición de Curso */}
      {modalEditar && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCerrarModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#00B9F0] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Edit2 size={20} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Editar Curso</h3>
                </div>
                <button
                  onClick={handleCerrarModal}
                  className="w-8 h-8 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
                  disabled={guardando}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Imagen de Portada
                </label>
                <div className="relative">
                  {preview ? (
                    <div className="relative group">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-xl"
                      />
                      <button
                        onClick={handleRemoveImage}
                        disabled={guardando}
                        className="absolute top-3 right-3 w-10 h-10 bg-[#FA6D00] hover:bg-[#FA6D00]/90 rounded-full shadow-lg transition flex items-center justify-center disabled:opacity-50"
                      >
                        <X size={20} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-64 rounded-xl bg-[#F7FAFC] border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center">
                      <Upload size={48} className="text-[#718096]" />
                      <p className="mt-2 text-sm text-[#718096]">Sin imagen de portada</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Cambiar Imagen (opcional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  disabled={guardando}
                  className="block w-full text-sm text-[#2D3748] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#00B9F0] file:text-white hover:file:bg-[#01C9F4] file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-2 text-xs text-[#718096]">
                  JPG, PNG, GIF o WEBP (máx. 5MB). Deja vacío para mantener la imagen actual.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Nombre del Curso <span className="text-[#FA6D00]">*</span>
                </label>
                <input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ingresa el nombre del curso"
                  disabled={guardando}
                  className="w-full border-2 border-[#E2E8F0] p-3 rounded-lg outline-none transition disabled:opacity-50 disabled:cursor-not-allowed focus:border-[#00B9F0] text-[#2D3748]"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-right text-[#718096]">
                  {formData.nombre.length}/100
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Descripción <span className="text-[#FA6D00]">*</span>
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el curso (objetivos, contenido, etc.)"
                  rows="5"
                  disabled={guardando}
                  className="w-full border-2 border-[#E2E8F0] p-3 rounded-lg outline-none resize-none transition disabled:opacity-50 disabled:cursor-not-allowed focus:border-[#00B9F0] text-[#2D3748]"
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-right text-[#718096]">
                  {formData.descripcion.length}/500
                </p>
              </div>
            </div>

            <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex gap-3">
              <button
                onClick={handleCerrarModal}
                disabled={guardando}
                className="flex-1 py-3 rounded-lg font-semibold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-[#E2E8F0] text-[#2D3748] hover:bg-[#718096] hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !formData.nombre.trim() || !formData.descripcion.trim()}
                className="flex-1 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? (
                  <>
                    <Loader2 className="animate-spin text-white" size={18} />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} className="text-white" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Perfil */}
      {modalPerfil && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCerrarModalPerfil}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#00B9F0] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Mi Perfil</h3>
                </div>
                <button
                  onClick={handleCerrarModalPerfil}
                  className="w-8 h-8 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
                  disabled={guardando}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Foto de Perfil */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  {perfilPreview || getFotoPerfilUrl(usuarioData?.fotoPerfilUrl) ? (
                    <img
                      src={perfilPreview || getFotoPerfilUrl(usuarioData?.fotoPerfilUrl)}
                      alt="Foto de perfil"
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#00B9F0]"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center text-white font-bold text-4xl border-4 border-[#00B9F0]">
                      {profesorNombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {perfilPreview && fotoCambiada && (
                    <button
                      onClick={handleRemoveFotoPerfil}
                      disabled={guardando}
                      className="absolute top-0 right-0 w-8 h-8 bg-[#FA6D00] hover:bg-[#FA6D00]/90 rounded-full shadow-lg transition disabled:opacity-50 flex items-center justify-center"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  )}
                </div>
                <label className="mt-4 cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFotoPerfilChange}
                    disabled={guardando}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00B9F0] hover:bg-[#01C9F4] text-white font-medium transition shadow-md hover:shadow-lg">
                    <Camera size={18} className="text-white" />
                    Cambiar Foto
                  </span>
                </label>
                <p className="mt-2 text-xs text-[#718096]">
                  JPG, PNG, GIF o WEBP (máx. 5MB)
                </p>
              </div>

              {/* Información del Usuario */}
              <div className="bg-[#F7FAFC] p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#2D3748]">Correo:</span>
                  <span className="text-sm text-[#718096]">{usuarioData?.correo || 'No disponible'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#2D3748]">Cédula:</span>
                  <span className="text-sm text-[#718096]">{usuarioData?.cedula || 'No disponible'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#2D3748]">Rol:</span>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#00B9F0] text-white">
                    {usuarioData?.rol || 'No disponible'}
                  </span>
                </div>
              </div>

              {/* Campos Editables */}
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Nombre <span className="text-[#FA6D00]">*</span>
                </label>
                <input
                  name="nombre"
                  value={perfilData.nombre}
                  onChange={handlePerfilInputChange}
                  placeholder="Ingresa tu nombre"
                  disabled={guardando}
                  className="w-full border-2 border-[#E2E8F0] p-3 rounded-lg outline-none transition disabled:opacity-50 focus:border-[#00B9F0] text-[#2D3748]"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Apellido
                </label>
                <input
                  name="apellido"
                  value={perfilData.apellido}
                  onChange={handlePerfilInputChange}
                  placeholder="Ingresa tu apellido"
                  disabled={guardando}
                  className="w-full border-2 border-[#E2E8F0] p-3 rounded-lg outline-none transition disabled:opacity-50 focus:border-[#00B9F0] text-[#2D3748]"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Teléfono
                </label>
                <input
                  name="telefono"
                  value={perfilData.telefono}
                  onChange={handlePerfilInputChange}
                  placeholder="Ingresa tu teléfono"
                  disabled={guardando}
                  className="w-full border-2 border-[#E2E8F0] p-3 rounded-lg outline-none transition disabled:opacity-50 focus:border-[#00B9F0] text-[#2D3748]"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex gap-3">
              <button
                onClick={handleCerrarModalPerfil}
                disabled={guardando}
                className="flex-1 py-3 rounded-lg font-semibold transition shadow-md disabled:opacity-50 bg-[#E2E8F0] text-[#2D3748] hover:bg-[#718096] hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPerfil}
                disabled={guardando || !perfilData.nombre.trim()}
                className="flex-1 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Loader2 className="animate-spin text-white" size={18} />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} className="text-white" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
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

export default ProfesorPage;