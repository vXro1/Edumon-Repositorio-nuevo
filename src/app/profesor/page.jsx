'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Plus, Edit2, LogOut, BookOpen, Trash2, X, Upload, Loader2, Users, User, Camera } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-edumon.onrender.com';

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
      
      // Cargar perfil completo del usuario
      fetchPerfil(token);
      fetchCursos(docenteId, token);
      
    } catch (error) {
      console.error('Error decodificando token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth/login');
    }

    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      if (perfilPreview && perfilPreview.startsWith('blob:')) {
        URL.revokeObjectURL(perfilPreview);
      }
    };
  }, [router]);

  const fetchPerfil = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Error al obtener perfil');
      }

      const data = await res.json();
      const usuario = data.usuario || data;
      
      setUsuarioData(usuario);
      setProfesorNombre(usuario.nombre || 'Profesor');
      
      // Actualizar localStorage
      localStorage.setItem('user', JSON.stringify(usuario));
      if (usuario.nombre) {
        localStorage.setItem('nombre', usuario.nombre);
      }
      
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const fetchCursos = async (docenteId, token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cursos/mis-cursos?docenteId=${docenteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Error al obtener cursos');
      }

      const data = await res.json();
      setGrados(data.cursos || []);
    } catch (error) {
      console.error('Error cargando cursos:', error);
      alert('No se pudieron cargar los cursos.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://static.wixstatic.com/media/1e4262_f8607b744443480ea6f88169e63b56c2~mv2.jpg/v1/fill/w_1000,h_540,al_c,q_85,usm_0.66_1.00_0.01/1e4262_f8607b744443480ea6f88169e63b56c2~mv2.jpg';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const getFotoPerfilUrl = (url) => {
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(profesorNombre)}&background=4A90E2&color=fff&size=200`;
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

      if (!cursoRes.ok) {
        throw new Error('Error al obtener información del curso');
      }

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
          
          if (Array.isArray(modulos)) {
            tieneModulos = modulos.length > 0;
          }
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
      alert('Hubo un error al verificar el curso. Redirigiendo a registro de padres...');
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
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setModalEditar(false);
    setCursoEditando(null);
    setFormData({ nombre: '', descripcion: '', imagen: null });
    setPreview(null);
    setImagenCambiada(false);
  };

  const handleCerrarModalPerfil = () => {
    if (perfilPreview && perfilPreview.startsWith('blob:')) {
      URL.revokeObjectURL(perfilPreview);
    }
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
        alert('Por favor selecciona una imagen válida (JPG, PNG, GIF, WEBP)');
        e.target.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        e.target.value = '';
        return;
      }

      setFormData((prev) => ({ ...prev, imagen: file }));
      setImagenCambiada(true);
      
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleFotoPerfilChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona una imagen válida (JPG, PNG, GIF, WEBP)');
        e.target.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        e.target.value = '';
        return;
      }

      setPerfilData((prev) => ({ ...prev, foto: file }));
      setFotoCambiada(true);
      
      if (perfilPreview && perfilPreview.startsWith('blob:')) {
        URL.revokeObjectURL(perfilPreview);
      }
      setPerfilPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setFormData((prev) => ({ ...prev, imagen: null }));
    setPreview(null);
    setImagenCambiada(true);
  };

  const handleRemoveFotoPerfil = () => {
    if (perfilPreview && perfilPreview.startsWith('blob:')) {
      URL.revokeObjectURL(perfilPreview);
    }
    setPerfilData((prev) => ({ ...prev, foto: null }));
    setPerfilPreview(null);
    setFotoCambiada(true);
  };

  const handleGuardarPerfil = async () => {
    if (!perfilData.nombre.trim()) {
      alert("⚠️ El nombre es requerido");
      return;
    }

    setGuardando(true);
    const token = localStorage.getItem("token");

    if (!token) {
      alert("⚠️ Sesión expirada. Por favor inicia sesión nuevamente.");
      router.push('/auth/login');
      return;
    }

    try {
      // Actualizar datos básicos del usuario
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

      // Si cambió la foto, actualizar la foto de perfil
      if (fotoCambiada && perfilData.foto instanceof File) {
        const formDataFoto = new FormData();
        formDataFoto.append('foto', perfilData.foto);

        const resFoto = await fetch(`${API_BASE_URL}/users/me/foto-perfil`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formDataFoto
        });

        if (!resFoto.ok) {
          console.error('Error al actualizar foto, pero datos guardados');
        } else {
          const dataFoto = await resFoto.json();
          usuarioActualizado.fotoPerfilUrl = dataFoto.usuario?.fotoPerfilUrl || dataFoto.fotoPerfilUrl;
        }
      }

      // Actualizar el estado local y localStorage
      setUsuarioData(usuarioActualizado);
      setProfesorNombre(usuarioActualizado.nombre);
      localStorage.setItem('user', JSON.stringify(usuarioActualizado));
      localStorage.setItem('nombre', usuarioActualizado.nombre);

      alert("✅ Perfil actualizado correctamente");
      handleCerrarModalPerfil();

    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      alert(`❌ ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim() || !formData.descripcion.trim()) {
      alert("⚠️ El nombre y la descripción son requeridos");
      return;
    }

    if (!cursoEditando) {
      alert("⚠️ No se ha seleccionado un curso para editar");
      return;
    }

    setGuardando(true);
    const token = localStorage.getItem("token");

    if (!token) {
      alert("⚠️ Sesión expirada. Por favor inicia sesión nuevamente.");
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: dataToSend,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          alert("⚠️ Sesión expirada. Por favor inicia sesión nuevamente.");
          router.push('/auth/login');
          return;
        }

        const errorMessage = errorData?.message || errorData?.error || `Error del servidor (Status: ${res.status})`;
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

      alert("✅ Curso actualizado correctamente");
      handleCerrarModal();

    } catch (error) {
      console.error("Error al actualizar curso:", error);
      alert(`❌ ${error.message}`);
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
      alert('✅ Curso eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando curso:', error);
      alert(`❌ No se pudo eliminar el curso: ${error.message}`);
    } finally {
      setEliminando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <Loader2 className="animate-spin mb-4" size={48} style={{ color: 'var(--azul-cielo)' }} />
        <p className="text-lg font-medium" style={{ color: 'var(--gris-oscuro)' }}>Cargando cursos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--gris-ultra-claro)' }}>
      {/* Header */}
      <header className="flex justify-between items-center flex-wrap gap-4 mb-8 bg-white shadow-sm p-6 rounded-2xl border" style={{ borderColor: 'var(--gris-claro)' }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleAbrirPerfil}
            className="relative group"
          >
            <img 
              src={getFotoPerfilUrl(usuarioData?.fotoPerfilUrl)} 
              alt="Perfil"
              className="w-16 h-16 rounded-full object-cover border-2 transition-all group-hover:border-4"
              style={{ borderColor: 'var(--azul-cielo)' }}
            />
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="text-white" size={20} />
            </div>
          </button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: 'var(--negro)' }}>
              Hola, {profesorNombre}
            </h1>
            <p className="text-sm sm:text-base" style={{ color: 'var(--gris-medio)' }}>
              Gestiona tus cursos y contenido educativo
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAbrirPerfil}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
            style={{ backgroundColor: 'var(--gris-medio)', color: 'white' }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <User size={20} /> Mi Perfil
          </button>
          <button
            onClick={handleCrearCurso}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
            style={{ backgroundColor: 'var(--azul-cielo)' }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <Plus size={20} /> Nuevo Curso
          </button>
          <button
            onClick={handleCerrarSesion}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
            style={{ backgroundColor: 'var(--rojo-error)' }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <LogOut size={20} /> Salir
          </button>
        </div>
      </header>

      {/* Lista de cursos */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--azul-cielo)' }}>
            <BookOpen className="text-white" size={24} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--negro)' }}>
            Mis Cursos
            <span className="ml-3 text-lg font-normal" style={{ color: 'var(--gris-medio)' }}>
              ({grados.length})
            </span>
          </h2>
        </div>

        {grados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border" style={{ borderColor: 'var(--gris-claro)' }}>
            <BookOpen className="mx-auto mb-4" size={64} style={{ color: 'var(--gris-claro)' }} />
            <p className="text-lg mb-2" style={{ color: 'var(--gris-medio)' }}>No tienes cursos registrados aún</p>
            <p className="text-sm mb-6" style={{ color: 'var(--gris-medio)' }}>Comienza creando tu primer curso</p>
            <button
              onClick={handleCrearCurso}
              className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl transition font-medium"
              style={{ backgroundColor: 'var(--azul-cielo)' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              <Plus size={20} /> Crear Primer Curso
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {grados.map((curso) => (
              <div
                key={curso._id}
                onClick={() => handleClickCurso(curso._id)}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border cursor-pointer"
                style={{ borderColor: 'var(--gris-claro)' }}
              >
                <div className="relative h-48">
                  <img
                    src={getImageUrl(curso.fotoPortadaUrl)}
                    alt={curso.nombre}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://static.wixstatic.com/media/1e4262_f8607b744443480ea6f88169e63b56c2~mv2.jpg/v1/fill/w_1000,h_540,al_c,q_85,usm_0.66_1.00_0.01/1e4262_f8607b744443480ea6f88169e63b56c2~mv2.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={(e) => handleEditar(e, curso)}
                      className="bg-white/95 hover:bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-110"
                      style={{ color: 'var(--azul-cielo)' }}
                      title="Editar curso"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => handleEliminar(e, curso._id)}
                      disabled={eliminando === curso._id}
                      className="bg-white/95 hover:bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 disabled:opacity-50"
                      style={{ color: 'var(--rojo-error)' }}
                      title="Eliminar curso"
                    >
                      {eliminando === curso._id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Trash2 size={18} />
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
                  <p className="text-sm mb-4 line-clamp-2 min-h-[40px]" style={{ color: 'var(--gris-medio)' }}>
                    {curso.descripcion}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--gris-claro)' }}>
                    <div className="flex items-center gap-2">
                      <Users size={16} style={{ color: 'var(--gris-medio)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--negro)' }}>
                        {curso.participantes?.length || 0}
                      </span>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ 
                      backgroundColor: curso.estado === 'activo' ? 'var(--verde-lima)' : 'var(--gris-claro)',
                      color: 'var(--blanco)'
                    }}>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCerrarModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--gris-claro)' }}>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--negro)' }}>
                Editar Curso
              </h3>
              <button
                onClick={handleCerrarModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={guardando}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--negro)' }}>
                  Imagen de Portada
                </label>
                <div className="relative">
                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-xl"
                      />
                      <button
                        onClick={handleRemoveImage}
                        disabled={guardando}
                        className="absolute top-3 right-3 text-white p-2 rounded-full shadow-lg transition disabled:opacity-50"
                        style={{ backgroundColor: 'var(--rojo-error)' }}
                        onMouseEnter={(e) => !guardando && (e.target.style.opacity = '0.9')}
                        onMouseLeave={(e) => !guardando && (e.target.style.opacity = '1')}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-64 rounded-xl flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--gris-ultra-claro)', border: '2px dashed var(--gris-claro)' }}>
                      <Upload size={48} style={{ color: 'var(--gris-medio)' }} />
                      <p className="mt-2 text-sm" style={{ color: 'var(--gris-medio)' }}>
                        Sin imagen de portada
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--negro)' }}>
                  Cambiar Imagen (opcional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  disabled={guardando}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: 'var(--gris-oscuro)' }}
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--gris-medio)' }}>
                  JPG, PNG, GIF o WEBP (máx. 5MB). Deja vacío para mantener la imagen actual.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--negro)' }}>
                  Nombre del Curso <span style={{ color: 'var(--rojo-error)' }}>*</span>
                </label>
                <input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ingresa el nombre del curso"
                  disabled={guardando}
                  className="w-full border-2 p-3 rounded-xl outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    borderColor: 'var(--gris-claro)',
                    color: 'var(--negro)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--azul-cielo)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gris-claro)'}
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-right" style={{ color: 'var(--gris-medio)' }}>
                  {formData.nombre.length}/100
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--negro)' }}>
                  Descripción <span style={{ color: 'var(--rojo-error)' }}>*</span>
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el curso (objetivos, contenido, etc.)"
                  rows="5"
                  disabled={guardando}
                  className="w-full border-2 p-3 rounded-xl outline-none resize-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    borderColor: 'var(--gris-claro)',
                    color: 'var(--negro)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--azul-cielo)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gris-claro)'}
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-right" style={{ color: 'var(--gris-medio)' }}>
                  {formData.descripcion.length}/500
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--gris-claro)' }}>
              <button
                onClick={handleCerrarModal}
                disabled={guardando}
                className="flex-1 py-3 rounded-xl font-semibold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: 'var(--gris-claro)',
                  color: 'var(--gris-oscuro)'
                }}
                onMouseEnter={(e) => !guardando && (e.target.style.backgroundColor = 'var(--gris-medio)')}
                onMouseLeave={(e) => !guardando && (e.target.style.backgroundColor = 'var(--gris-claro)')}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !formData.nombre.trim() || !formData.descripcion.trim()}
                className="flex-1 text-white py-3 rounded-xl font-semibold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--verde-exito)' }}
                onMouseEnter={(e) => !guardando && (e.target.style.opacity = '0.9')}
                onMouseLeave={(e) => !guardando && (e.target.style.opacity = '1')}
              >
                {guardando ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Guardando...
                  </>
                ) : (
                  '✓ Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Perfil */}
      {modalPerfil && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCerrarModalPerfil}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--gris-claro)' }}>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--negro)' }}>
                Mi Perfil
              </h3>
              <button
                onClick={handleCerrarModalPerfil}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={guardando}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Foto de Perfil */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src={perfilPreview || getFotoPerfilUrl(usuarioData?.fotoPerfilUrl)}
                    alt="Foto de perfil"
                    className="w-32 h-32 rounded-full object-cover border-4"
                    style={{ borderColor: 'var(--azul-cielo)' }}
                  />
                  {perfilPreview && fotoCambiada && (
                    <button
                      onClick={handleRemoveFotoPerfil}
                      disabled={guardando}
                      className="absolute top-0 right-0 text-white p-2 rounded-full shadow-lg transition disabled:opacity-50"
                      style={{ backgroundColor: 'var(--rojo-error)' }}
                    >
                      <X size={16} />
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
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition shadow-md hover:shadow-lg"
                    style={{ backgroundColor: 'var(--azul-cielo)' }}
                  >
                    <Camera size={18} />
                    Cambiar Foto
                  </span>
                </label>
                <p className="mt-2 text-xs" style={{ color: 'var(--gris-medio)' }}>
                  JPG, PNG, GIF o WEBP (máx. 5MB)
                </p>
              </div>

              {/* Información del Usuario */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm" style={{ color: 'var(--gris-medio)' }}>
                  <strong>Correo:</strong> {usuarioData?.correo || 'No disponible'}
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--gris-medio)' }}>
                  <strong>Cédula:</strong> {usuarioData?.cedula || 'No disponible'}
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--gris-medio)' }}>
                  <strong>Rol:</strong> {usuarioData?.rol || 'No disponible'}
                </p>
              </div>

              {/* Campos Editables */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--negro)' }}>
                  Nombre <span style={{ color: 'var(--rojo-error)' }}>*</span>
                </label>
                <input
                  name="nombre"
                  value={perfilData.nombre}
                  onChange={handlePerfilInputChange}
                  placeholder="Ingresa tu nombre"
                  disabled={guardando}
                  className="w-full border-2 p-3 rounded-xl outline-none transition disabled:opacity-50"
                  style={{ 
                    borderColor: 'var(--gris-claro)',
                    color: 'var(--negro)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--azul-cielo)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gris-claro)'}
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--negro)' }}>
                  Apellido
                </label>
                <input
                  name="apellido"
                  value={perfilData.apellido}
                  onChange={handlePerfilInputChange}
                  placeholder="Ingresa tu apellido"
                  disabled={guardando}
                  className="w-full border-2 p-3 rounded-xl outline-none transition disabled:opacity-50"
                  style={{ 
                    borderColor: 'var(--gris-claro)',
                    color: 'var(--negro)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--azul-cielo)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gris-claro)'}
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--negro)' }}>
                  Teléfono
                </label>
                <input
                  name="telefono"
                  value={perfilData.telefono}
                  onChange={handlePerfilInputChange}
                  placeholder="Ingresa tu teléfono"
                  disabled={guardando}
                  className="w-full border-2 p-3 rounded-xl outline-none transition disabled:opacity-50"
                  style={{ 
                    borderColor: 'var(--gris-claro)',
                    color: 'var(--negro)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--azul-cielo)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gris-claro)'}
                  maxLength={15}
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--gris-claro)' }}>
              <button
                onClick={handleCerrarModalPerfil}
                disabled={guardando}
                className="flex-1 py-3 rounded-xl font-semibold transition shadow-md disabled:opacity-50"
                style={{ 
                  backgroundColor: 'var(--gris-claro)',
                  color: 'var(--gris-oscuro)'
                }}
                onMouseEnter={(e) => !guardando && (e.target.style.backgroundColor = 'var(--gris-medio)')}
                onMouseLeave={(e) => !guardando && (e.target.style.backgroundColor = 'var(--gris-claro)')}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPerfil}
                disabled={guardando || !perfilData.nombre.trim()}
                className="flex-1 text-white py-3 rounded-xl font-semibold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--verde-exito)' }}
                onMouseEnter={(e) => !guardando && (e.target.style.opacity = '0.9')}
                onMouseLeave={(e) => !guardando && (e.target.style.opacity = '1')}
              >
                {guardando ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Guardando...
                  </>
                ) : (
                  '✓ Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfesorPage;