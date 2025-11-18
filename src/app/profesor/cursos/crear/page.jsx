'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeft, Upload, X, BookOpen, Home, Save, Image as ImageIcon, AlertCircle, Info } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';

// Componente de Loading Screen
import LoadingScreen from '@/components/LoadingScreen'; // Ajusta la ruta según tu estructura

const CrearCursoPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [docenteId, setDocenteId] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagen: null,
  });
  const [preview, setPreview] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mensajeCarga, setMensajeCarga] = useState('Procesando...');

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
      
      const id = decoded.id || decoded._id || decoded.userId || userData?._id || userData?.id;
      setDocenteId(id);
      
      const rol = decoded.rol || decoded.role || userData?.rol || userData?.role;
      
      if (rol !== 'docente' && rol !== 'administrador') {
        alert(`No tienes permisos para crear cursos. Tu rol actual es: "${rol}"`);
        router.push('/profesor');
        return;
      }
      
      if (!id) {
        alert('Error: No se pudo obtener tu identificación de usuario');
        router.push('/auth/login');
        return;
      }
      
    } catch (error) {
      console.error('Error decodificando token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length < 2 || formData.nombre.length > 100) {
      newErrors.nombre = 'El nombre debe tener entre 2 y 100 caracteres';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    } else if (formData.descripcion.length < 10 || formData.descripcion.length > 500) {
      newErrors.descripcion = 'La descripción debe tener entre 10 y 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrors((prev) => ({ 
        ...prev, 
        imagen: 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP)' 
      }));
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ 
        ...prev, 
        imagen: 'La imagen no debe superar 5MB' 
      }));
      e.target.value = '';
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImageLoaded(false);
    setFormData((prev) => ({ ...prev, imagen: file }));
    setPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, imagen: '' }));
  };

  const handleRemoveImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFormData((prev) => ({ ...prev, imagen: null }));
    setPreview(null);
    setImageLoaded(false);
    const fileInput = document.getElementById('imagen-input');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!docenteId) {
      alert('❌ Error: No se pudo obtener el ID del docente. Por favor, inicia sesión nuevamente.');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setUploadProgress(10);
    setMensajeCarga('Preparando información...');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('❌ No hay sesión activa. Por favor inicia sesión.');
        router.push('/auth/login');
        return;
      }

      setUploadProgress(20);
      setMensajeCarga('Validando datos...');

      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre.trim());
      formDataToSend.append('descripcion', formData.descripcion.trim());
      formDataToSend.append('docenteId', docenteId);

      if (formData.imagen) {
        formDataToSend.append('fotoPortada', formData.imagen, formData.imagen.name);
      }

      setUploadProgress(40);
      setMensajeCarga('Subiendo al servidor...');
      
      const res = await fetch(`${API_BASE_URL}/cursos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      setUploadProgress(60);
      setMensajeCarga('Procesando respuesta...');

      const textResponse = await res.text();

      setUploadProgress(75);

      let data;
      try {
        data = textResponse ? JSON.parse(textResponse) : {};
      } catch (parseError) {
        throw new Error(`Respuesta inválida del servidor: ${textResponse.substring(0, 100)}`);
      }

      setUploadProgress(85);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          alert('❌ Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth/login');
          return;
        }

        if (data.errors && Array.isArray(data.errors)) {
          const backendErrors = {};
          data.errors.forEach((error) => {
            if (error.path) {
              backendErrors[error.path] = error.msg;
            }
          });
          setErrors(backendErrors);
          
          const mensajes = data.errors.map(e => e.msg).join('\n• ');
          alert(`❌ Errores de validación:\n• ${mensajes}`);
          return;
        }

        if (res.status === 500) {
          const errorMsg = data.message || 'Error interno del servidor';
          const detalles = data.error || data.details || '';
          
          alert(
            `❌ Error del servidor:\n\n${errorMsg}\n\n` +
            `${detalles ? `Detalles: ${detalles}\n\n` : ''}` +
            `Por favor contacta al administrador o intenta nuevamente.`
          );
          return;
        }
        
        const errorMessage = data.message || data.error || data.msg || 
                           `Error ${res.status}: Error al crear el curso`;
        
        alert(`❌ ${errorMessage}`);
        return;
      }

      setUploadProgress(100);
      setMensajeCarga('¡Curso creado exitosamente!');
      
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      
      setTimeout(() => {
        alert('✅ ¡Curso creado exitosamente!');
        router.push('/profesor');
      }, 500);
      
    } catch (error) {
      console.error('Error fatal:', error);
      
      let mensajeUsuario = 'Error desconocido al crear el curso';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        mensajeUsuario = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        mensajeUsuario = 'Error de conexión. El servidor no está disponible.';
      } else if (error.message) {
        mensajeUsuario = error.message;
      }
      
      alert(`❌ ${mensajeUsuario}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleVolver = () => {
    if (formData.nombre || formData.descripcion || formData.imagen) {
      const confirmar = confirm('¿Seguro que deseas salir? Los cambios no guardados se perderán.');
      if (!confirmar) return;
    }
    
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    
    router.push('/profesor');
  };

  if (loading) {
    return <LoadingScreen mensaje={mensajeCarga} progress={uploadProgress} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleVolver}
                className="flex items-center gap-2 text-[#718096] hover:text-[#00B9F0] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#00B9F0] flex items-center justify-center text-white hover:bg-[#01C9F4] transition-colors">
                  <ArrowLeft size={18} className="text-white" />
                </div>
                <span className="font-semibold text-sm hidden sm:inline">Volver</span>
              </button>
              <div className="h-6 w-px bg-[#E2E8F0]"></div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#00B9F0] flex items-center justify-center">
                  <BookOpen size={18} className="text-white" />
                </div>
                <h1 className="text-base sm:text-lg font-bold text-[#2D3748]">Crear Nuevo Curso</h1>
              </div>
            </div>

            <button
              onClick={() => router.push('/profesor')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#E2E8F0] hover:bg-[#718096] text-[#2D3748] hover:text-white rounded-lg transition-all text-sm font-medium"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <Home size={16} />
              </div>
              <span className="hidden sm:inline">Inicio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 sm:p-8 space-y-6">
              {/* Imagen de portada */}
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-3">
                  Imagen de Portada <span className="text-[#718096] font-normal">(opcional)</span>
                </label>
                <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl overflow-hidden hover:border-[#00B9F0] transition-all duration-300 bg-[#F7FAFC]">
                  {preview ? (
                    <div className="relative group">
                      {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#E2E8F0] via-[#F7FAFC] to-[#E2E8F0] animate-pulse flex items-center justify-center">
                          <div className="w-12 h-12 border-4 border-[#00B9F0] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <img
                          src={preview}
                          alt="Vista previa"
                          onLoad={() => setImageLoaded(true)}
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-[#FE327B] hover:bg-[#FE327B]/90 text-white px-6 py-3 rounded-lg shadow-lg transition-all flex items-center gap-2 transform hover:scale-105 font-semibold"
                        >
                          <X size={18} className="text-white" />
                          Eliminar imagen
                        </button>
                      </div>
                      
                      {imageLoaded && (
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#2D3748] text-xs px-3 py-2 rounded-full shadow-lg flex items-center gap-2 max-w-[calc(100%-24px)]">
                          <ImageIcon size={14} className="flex-shrink-0" />
                          <span className="truncate">{formData.imagen?.name}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="inline-block p-4 bg-[#00B9F0]/10 rounded-2xl mb-4">
                        <ImageIcon className="text-[#00B9F0]" size={48} />
                      </div>
                      <p className="text-base text-[#2D3748] mb-2 font-semibold">
                        Selecciona una imagen para tu curso
                      </p>
                      <p className="text-sm text-[#718096] mb-4">
                        JPG, PNG, GIF o WEBP - Máximo 5MB
                      </p>
                      <input
                        id="imagen-input"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="imagen-input"
                        className="inline-flex items-center gap-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white px-6 py-3 rounded-xl cursor-pointer transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold"
                      >
                        <Upload size={18} className="text-white" />
                        Elegir archivo
                      </label>
                    </div>
                  )}
                </div>
                {errors.imagen && (
                  <p className="text-[#FE327B] text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.imagen}
                  </p>
                )}
              </div>

              {/* Nombre del curso */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Nombre del Curso <span className="text-[#FE327B]">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Curso 11, Matemáticas Avanzadas..."
                  maxLength={100}
                  className={`w-full border-2 ${
                    errors.nombre ? 'border-[#FE327B]' : 'border-[#E2E8F0]'
                  } rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#00B9F0] focus:border-[#00B9F0] transition-all`}
                />
                <div className="flex justify-between mt-2">
                  {errors.nombre ? (
                    <p className="text-[#FE327B] text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.nombre}
                    </p>
                  ) : (
                    <p className="text-[#718096] text-xs">Mínimo 2 caracteres</p>
                  )}
                  <p className={`text-xs font-medium ${
                    formData.nombre.length > 90 ? 'text-[#FA6D00]' : 
                    formData.nombre.length > 0 ? 'text-[#00B9F0]' : 'text-[#718096]'
                  }`}>
                    {formData.nombre.length}/100
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Descripción <span className="text-[#FE327B]">*</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el contenido, objetivos y temas principales del curso..."
                  rows="5"
                  maxLength={500}
                  className={`w-full border-2 ${
                    errors.descripcion ? 'border-[#FE327B]' : 'border-[#E2E8F0]'
                  } rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#00B9F0] focus:border-[#00B9F0] resize-none transition-all`}
                />
                <div className="flex justify-between mt-2">
                  {errors.descripcion ? (
                    <p className="text-[#FE327B] text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.descripcion}
                    </p>
                  ) : (
                    <p className="text-[#718096] text-xs">Mínimo 10 caracteres</p>
                  )}
                  <p className={`text-xs font-medium ${
                    formData.descripcion.length > 450 ? 'text-[#FA6D00]' : 
                    formData.descripcion.length > 0 ? 'text-[#00B9F0]' : 'text-[#718096]'
                  }`}>
                    {formData.descripcion.length}/500
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#F7FAFC] px-6 sm:px-8 py-5 border-t border-[#E2E8F0]">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleVolver}
                  className="flex-1 bg-white border-2 border-[#E2E8F0] hover:bg-[#F7FAFC] hover:border-[#718096] text-[#2D3748] py-3 rounded-xl font-semibold transition-all shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!docenteId}
                  className="flex-1 sm:flex-[2] bg-[#00B9F0] hover:bg-[#01C9F4] text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Save size={20} className="text-white" />
                  Guardar Curso
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-[#00B9F0]/5 border border-[#00B9F0]/20 rounded-xl p-5">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center flex-shrink-0">
              <Info className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2D3748] mb-1">
                Consejo importante
              </p>
              <p className="text-sm text-[#718096] leading-relaxed">
                Después de crear el curso, podrás agregar módulos, lecciones y gestionar participantes desde el panel principal. La imagen de portada es opcional y puede ser agregada después.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearCursoPage;