'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeft, Upload, X, BookOpen, Home, Save, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log('🔍 Token decodificado:', decoded);
      
      let userData = null;
      if (userStr) {
        try {
          userData = JSON.parse(userStr);
          console.log('👤 User desde localStorage:', userData);
        } catch (e) {
          console.error('Error parseando user:', e);
        }
      }
      
      const id = decoded.id || decoded._id || decoded.userId || userData?._id || userData?.id;
      setDocenteId(id);
      
      const rol = decoded.rol || decoded.role || userData?.rol || userData?.role;
      
      console.log('👤 ID del usuario:', id);
      console.log('🎭 Rol del usuario:', rol);
      
      if (rol !== 'docente' && rol !== 'administrador') {
        console.error('❌ Rol no autorizado:', rol);
        alert(`No tienes permisos para crear cursos. Tu rol actual es: "${rol}"`);
        router.push('/profesor');
        return;
      }
      
      if (!id) {
        console.error('❌ No se pudo obtener el ID del usuario');
        alert('Error: No se pudo obtener tu identificación de usuario');
        router.push('/auth/login');
        return;
      }
      
      console.log('✅ Permisos verificados correctamente');
      
    } catch (error) {
      console.error('❌ Error decodificando token:', error);
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

    console.log('📁 Archivo seleccionado:', {
      nombre: file.name,
      tipo: file.type,
      tamaño: `${(file.size / 1024).toFixed(2)} KB`
    });

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
    
    console.log('✅ Imagen cargada correctamente');
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
    console.log('🗑️ Imagen eliminada');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🚀 ==================== INICIANDO CREACIÓN DE CURSO ====================');

    if (!validateForm()) {
      console.log('❌ Formulario inválido');
      return;
    }

    if (!docenteId) {
      console.error('❌ docenteId vacío');
      alert('❌ Error: No se pudo obtener el ID del docente. Por favor, inicia sesión nuevamente.');
      router.push('/auth/login');
      return;
    }

    console.log('✅ Validaciones pasadas');
    console.log('📋 Datos del formulario:', {
      nombre: formData.nombre,
      descripcion: formData.descripcion.substring(0, 50) + '...',
      docenteId: docenteId,
      tieneImagen: !!formData.imagen
    });

    setLoading(true);
    setUploadProgress(10);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('❌ No hay sesión activa. Por favor inicia sesión.');
        router.push('/auth/login');
        return;
      }

      const decodedToken = jwtDecode(token);
      console.log('🔐 Token válido para:', decodedToken.nombre || decodedToken.email);

      setUploadProgress(20);

      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre.trim());
      formDataToSend.append('descripcion', formData.descripcion.trim());
      formDataToSend.append('docenteId', docenteId);

      if (formData.imagen) {
        formDataToSend.append('fotoPortada', formData.imagen, formData.imagen.name);
        console.log('📷 Imagen incluida en el FormData');
      } else {
        console.log('📝 Creando curso sin imagen');
      }

      console.log('📤 Contenido del FormData:');
      for (let pair of formDataToSend.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ✓ ${pair[0]}: [File] ${pair[1].name} (${pair[1].type}, ${(pair[1].size / 1024).toFixed(2)} KB)`);
        } else {
          console.log(`  ✓ ${pair[0]}: "${pair[1]}"`);
        }
      }

      setUploadProgress(40);

      console.log('📡 Enviando petición a:', `${API_BASE_URL}/cursos`);
      
      const res = await fetch(`${API_BASE_URL}/cursos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      setUploadProgress(60);

      console.log('📡 Respuesta del servidor:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });

      const textResponse = await res.text();
      console.log('📄 Respuesta raw:', textResponse);

      setUploadProgress(75);

      let data;
      try {
        data = textResponse ? JSON.parse(textResponse) : {};
        console.log('📥 Datos parseados:', data);
      } catch (parseError) {
        console.error('❌ Error parseando respuesta:', parseError);
        throw new Error(`Respuesta inválida del servidor: ${textResponse.substring(0, 100)}`);
      }

      setUploadProgress(85);

      if (!res.ok) {
        console.error('❌ ERROR DEL SERVIDOR:');
        console.error('  Status:', res.status);
        console.error('  Data:', data);

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
      console.log('✅ ¡CURSO CREADO EXITOSAMENTE!');
      console.log('📦 Curso creado:', data.curso);
      console.log('========================================================');
      
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      
      alert('✅ ¡Curso creado exitosamente!');
      router.push('/profesor');
      
    } catch (error) {
      console.error('❌ ==================== ERROR FATAL ====================');
      console.error('Tipo:', error.name);
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      console.error('========================================================');
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modal de progreso - Transparente */}
      {loading && uploadProgress > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Creando tu curso
              </h3>
              <p className="text-gray-600 mb-6">
                Por favor espera mientras guardamos la información...
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium text-gray-700">
                  <span>Progreso</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {uploadProgress < 30 && 'Preparando información...'}
                  {uploadProgress >= 30 && uploadProgress < 70 && 'Subiendo datos al servidor...'}
                  {uploadProgress >= 70 && uploadProgress < 100 && 'Finalizando creación...'}
                  {uploadProgress === 100 && '¡Completado!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleVolver}
                disabled={loading}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group disabled:opacity-50"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium hidden sm:inline">Volver</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg">
                  <BookOpen className="text-white" size={20} />
                </div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Crear Nuevo Curso</h1>
              </div>
            </div>
            <button
              onClick={() => router.push('/profesor')}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Home size={18} />
              <span className="hidden sm:inline text-sm">Inicio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-4 sm:p-8">
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                  <p className="font-mono"><strong>DocenteId:</strong> {docenteId || 'No establecido'}</p>
                  <p className="font-mono"><strong>API URL:</strong> {API_BASE_URL}</p>
                  <p className="font-mono"><strong>Tiene imagen:</strong> {formData.imagen ? `Sí (${formData.imagen.name})` : 'No'}</p>
                </div>
              )}

              {/* Imagen de portada */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Imagen de Portada <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-gray-50 to-blue-50/30">
                  {preview ? (
                    <div className="relative group">
                      {/* Skeleton/Loading state mientras carga la imagen */}
                      {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse flex items-center justify-center">
                          <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                        </div>
                      )}
                      
                      {/* Contenedor de imagen con aspect ratio */}
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
                        <img
                          src={preview}
                          alt="Vista previa"
                          onLoad={() => setImageLoaded(true)}
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </div>
                      
                      {/* Overlay con botones */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={loading}
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl transition-all flex items-center gap-2 transform hover:scale-105 disabled:opacity-50"
                        >
                          <X size={20} />
                          Eliminar imagen
                        </button>
                      </div>
                      
                      {/* Badge con nombre del archivo */}
                      {imageLoaded && (
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-gray-700 text-xs px-3 py-2 rounded-full shadow-lg flex items-center gap-2 max-w-[calc(100%-24px)]">
                          <ImageIcon size={14} className="flex-shrink-0" />
                          <span className="truncate">{formData.imagen?.name}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 sm:p-12 text-center">
                      <div className="inline-block p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl mb-4 shadow-inner">
                        <ImageIcon className="text-blue-500" size={48} />
                      </div>
                      <p className="text-base text-gray-700 mb-2 font-medium">
                        Selecciona una imagen para tu curso
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        JPG, PNG, GIF o WEBP - Máximo 5MB
                      </p>
                      <input
                        id="imagen-input"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileChange}
                        disabled={loading}
                        className="hidden"
                      />
                      <label
                        htmlFor="imagen-input"
                        className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl cursor-pointer transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload size={18} />
                        Elegir archivo
                      </label>
                    </div>
                  )}
                </div>
                {errors.imagen && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1 animate-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    {errors.imagen}
                  </p>
                )}
              </div>

              {/* Nombre del curso */}
              <div className="mb-6">
                <label htmlFor="nombre" className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre del Curso <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Ej: Curso 11, Matemáticas Avanzadas..."
                  maxLength={100}
                  className={`w-full border-2 ${
                    errors.nombre ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  } rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
                />
                <div className="flex justify-between mt-2">
                  {errors.nombre ? (
                    <p className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-top-2">
                      <AlertCircle size={16} />
                      {errors.nombre}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm">Mínimo 2 caracteres</p>
                  )}
                  <p className={`text-sm font-medium transition-colors ${
                    formData.nombre.length > 90 ? 'text-orange-500' : 
                    formData.nombre.length > 0 ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {formData.nombre.length}/100
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <label htmlFor="descripcion" className="block text-sm font-bold text-gray-700 mb-2">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Describe el contenido, objetivos y temas principales del curso..."
                  rows="5"
                  maxLength={500}
                  className={`w-full border-2 ${
                    errors.descripcion ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  } rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
                />
                <div className="flex justify-between mt-2">
                  {errors.descripcion ? (
                    <p className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-top-2">
                      <AlertCircle size={16} />
                      {errors.descripcion}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm">Mínimo 10 caracteres</p>
                  )}
                  <p className={`text-sm font-medium transition-colors ${
                    formData.descripcion.length > 450 ? 'text-orange-500' : 
                    formData.descripcion.length > 0 ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {formData.descripcion.length}/500
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-8 py-5 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleVolver}
                  disabled={loading}
                  className="flex-1 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !docenteId}
                  className="flex-1 sm:flex-[2] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Guardar Curso
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 text-2xl">💡</div>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Consejo importante
              </p>
              <p className="text-sm text-blue-800 leading-relaxed">
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