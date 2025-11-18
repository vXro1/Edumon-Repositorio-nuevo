'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  ThumbsUp,
  Edit,
  Trash2,
  ArrowLeft,
  User,
  Clock,
  Image,
  Video,
  FileText,
  File,
  Lock,
  Unlock,
  Reply,
  X,
  Paperclip,
  AlertCircle,
  Home,
  BookOpen,
  ClipboardList,
  Sparkles,
  Download,
  ExternalLink,
  Play
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-edumon.onrender.com';

import LoadingScreen from '@/components/LoadingScreen'; // Ajusta la ruta según tu estructura


const ForoRespuestasPage = () => {
  const [foro, setForo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [modalRespuesta, setModalRespuesta] = useState(false);
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [imagenExpandida, setImagenExpandida] = useState(null);
  const [likesAnimando, setLikesAnimando] = useState({});

  const [contenido, setContenido] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [previsualizaciones, setPrevisualizaciones] = useState([]);
  const [respuestaA, setRespuestaA] = useState(null);

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cursoId, setCursoId] = useState(null);
  const [foroId, setForoId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const curso = searchParams.get('cursoId');
      const foro = searchParams.get('foroId');
      setCursoId(curso);
      setForoId(foro);
    }
  }, []);

  useEffect(() => {
    if (foroId && cursoId) {
      cargarDatos();
    }
  }, [foroId, cursoId]);

  const cargarDatos = async () => {
    await Promise.all([
      cargarForo(),
      cargarMensajes(),
      cargarUsuarioActual()
    ]);
  };

  const cargarUsuarioActual = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarioActual(data.usuario);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  const cargarForo = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/foros/${foroId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al cargar el foro');

      const data = await res.json();
      setForo(data.foro);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar el foro');
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajes = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/mensajes-foro/foro/${foroId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al cargar mensajes');

      const data = await res.json();

      const mensajesAplanados = [];
      if (data.mensajes && Array.isArray(data.mensajes)) {
        data.mensajes.forEach(mensaje => {
          // Normalizar el campo de usuario
          if (mensaje.usuarioId) {
            mensaje.usuarioId = {
              ...mensaje.usuarioId,
              nombre: mensaje.usuarioId.nombre || '',
              apellido: mensaje.usuarioId.apellido || '',
              avatar: mensaje.usuarioId.avatar || mensaje.usuarioId.fotoPerfilUrl || null,
              rol: mensaje.usuarioId.rol || 'usuario'
            };
          }

          // Normalizar likes - convertir likedBy array a likes array
          mensaje.likes = Array.isArray(mensaje.likedBy) ? mensaje.likedBy : 
                         Array.isArray(mensaje.likes) ? mensaje.likes : [];
          
          mensajesAplanados.push({
            ...mensaje,
            respuestas: (mensaje.respuestas || []).map(resp => ({
              ...resp,
              // Normalizar también las respuestas
              likes: Array.isArray(resp.likedBy) ? resp.likedBy : 
                     Array.isArray(resp.likes) ? resp.likes : [],
              usuarioId: resp.usuarioId ? {
                ...resp.usuarioId,
                nombre: resp.usuarioId.nombre || '',
                apellido: resp.usuarioId.apellido || '',
                avatar: resp.usuarioId.avatar || resp.usuarioId.fotoPerfilUrl || null,
                rol: resp.usuarioId.rol || 'usuario'
              } : resp.usuarioId
            }))
          });
        });
      }

      setMensajes(mensajesAplanados);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar los mensajes');
    }
  };

  const getAvatarUrl = (usuario) => {
    if (!usuario) return null;
    
    // Si tiene avatar
    if (usuario.avatar) {
      if (usuario.avatar.startsWith('http')) return usuario.avatar;
      return `${BACKEND_URL}${usuario.avatar}`;
    }
    
    // Si tiene fotoPerfilUrl (campo alternativo)
    if (usuario.fotoPerfilUrl) {
      if (usuario.fotoPerfilUrl.startsWith('http')) return usuario.fotoPerfilUrl;
      return `${BACKEND_URL}${usuario.fotoPerfilUrl}`;
    }
    
    return null;
  };

  const getArchivoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
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

  const abrirModalRespuesta = (mensaje = null) => {
    if (foro?.estado === 'cerrado') {
      alert('El foro está cerrado y no acepta nuevas respuestas');
      return;
    }

    setRespuestaA(mensaje);
    setModalRespuesta(true);
    setContenido('');
    setArchivos([]);
    setPrevisualizaciones([]);
  };

  const abrirModalEdicion = (mensaje) => {
    setMensajeSeleccionado(mensaje);
    setModoEdicion(true);
    setContenido(mensaje.contenido);
    setModalRespuesta(true);
  };

  const cerrarModal = () => {
    setModalRespuesta(false);
    setModoEdicion(false);
    setMensajeSeleccionado(null);
    setRespuestaA(null);
    setContenido('');
    setArchivos([]);
    setPrevisualizaciones([]);
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();

    if (!contenido.trim()) {
      alert('Por favor escribe un mensaje');
      return;
    }

    const token = localStorage.getItem('token');
    setEnviando(true);

    try {
      if (modoEdicion) {
        const res = await fetch(`${API_BASE_URL}/mensajes-foro/${mensajeSeleccionado._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ contenido })
        });

        if (!res.ok) throw new Error('Error al actualizar el mensaje');
        alert('Mensaje actualizado correctamente');
      } else {
        const formData = new FormData();
        formData.append('foroId', foroId);
        formData.append('contenido', contenido);
        if (respuestaA) {
          formData.append('respuestaA', respuestaA._id);
        }

        archivos.forEach(archivo => {
          formData.append('archivos', archivo);
        });

        const res = await fetch(`${API_BASE_URL}/mensajes-foro`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (!res.ok) throw new Error('Error al enviar el mensaje');
        alert('Mensaje enviado correctamente');
      }

      cerrarModal();
      await cargarMensajes();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setEnviando(false);
    }
  };

  const toggleLike = async (mensajeId) => {
    const token = localStorage.getItem('token');
    try {
      console.log('🔄 Intentando dar like al mensaje:', mensajeId);
      
      // Activar animación
      setLikesAnimando(prev => ({ ...prev, [mensajeId]: true }));
      
      const res = await fetch(`${API_BASE_URL}/mensajes-foro/${mensajeId}/like`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Respuesta del servidor:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Error del servidor:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || 'Error al dar like' };
        }
        
        setLikesAnimando(prev => ({ ...prev, [mensajeId]: false }));
        throw new Error(errorData.message || 'Error al dar like');
      }

      const data = await res.json();
      console.log('✅ Like actualizado:', data);

      // Actualizar el estado local inmediatamente para mejor UX
      setMensajes(prevMensajes => 
        prevMensajes.map(msg => {
          if (msg._id === mensajeId) {
            const yaLeDioLike = Array.isArray(msg.likes) && msg.likes.includes(usuarioActual?._id);
            return {
              ...msg,
              likes: yaLeDioLike 
                ? msg.likes.filter(id => id !== usuarioActual?._id)
                : [...(msg.likes || []), usuarioActual?._id]
            };
          }
          // También actualizar en respuestas
          if (msg.respuestas) {
            return {
              ...msg,
              respuestas: msg.respuestas.map(resp => {
                if (resp._id === mensajeId) {
                  const yaLeDioLike = Array.isArray(resp.likes) && resp.likes.includes(usuarioActual?._id);
                  return {
                    ...resp,
                    likes: yaLeDioLike 
                      ? resp.likes.filter(id => id !== usuarioActual?._id)
                      : [...(resp.likes || []), usuarioActual?._id]
                  };
                }
                return resp;
              })
            };
          }
          return msg;
        })
      );

      // Recargar todos los mensajes del servidor
      await cargarMensajes();
      
      // Desactivar animación después de completarla
      setTimeout(() => {
        setLikesAnimando(prev => ({ ...prev, [mensajeId]: false }));
      }, 600);
    } catch (error) {
      console.error('❌ Error completo:', error);
      alert(error.message);
      setLikesAnimando(prev => ({ ...prev, [mensajeId]: false }));
    }
  };

  const eliminarMensaje = async (mensajeId) => {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/mensajes-foro/${mensajeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al eliminar el mensaje');

      alert('Mensaje eliminado correctamente');
      await cargarMensajes();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  const getIconoArchivo = (tipo) => {
    switch (tipo) {
      case 'imagen': return Image;
      case 'video': return Video;
      case 'pdf': return FileText;
      default: return File;
    }
  };

  const getRolBadgeColor = (rol) => {
    switch (rol?.toLowerCase()) {
      case 'docente':
        return 'bg-[#FE327B]/10 text-[#FE327B] border border-[#FE327B]/20';
      case 'padre':
        return 'bg-[#7AD107]/10 text-[#7AD107] border border-[#7AD107]/20';
      case 'administrador':
        return 'bg-[#FA6D00]/10 text-[#FA6D00] border border-[#FA6D00]/20';
      default:
        return 'bg-[#E2E8F0] text-[#718096] border border-[#E2E8F0]';
    }
  };

  const renderArchivosAdjuntos = (archivos) => {
    if (!archivos || archivos.length === 0) return null;

    return (
      <div className="mb-4 space-y-3">
        <p className="text-sm font-bold text-[#2D3748] flex items-center gap-2">
          <Paperclip size={16} />
          Archivos adjuntos ({archivos.length})
        </p>

        <div className="grid grid-cols-1 gap-3">
          {archivos.map((archivo, index) => {
            const archivoUrl = getArchivoUrl(archivo.url);

            if (archivo.tipo === "imagen") {
              return (
                <div key={index} className="group relative">
                  <img
                    src={archivoUrl}
                    alt={archivo.nombre}
                    className="w-full max-h-96 object-contain rounded-xl border-2 border-[#E2E8F0] cursor-pointer hover:border-[#00B9F0] transition-all"
                    onClick={() => setImagenExpandida(archivoUrl)}
                  />

                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setImagenExpandida(archivoUrl)}
                      className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg backdrop-blur-sm transition-all"
                      title="Expandir imagen"
                    >
                      <ExternalLink size={16} />
                    </button>

                    <a
                      href={archivoUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg backdrop-blur-sm transition-all"
                      title="Descargar imagen"
                    >
                      <Download size={16} />
                    </a>
                  </div>

                  <p className="text-xs text-[#718096] mt-2 truncate">{archivo.nombre}</p>
                </div>
              );
            }

            if (archivo.tipo === "video") {
              return (
                <div key={index} className="group relative">
                  <video
                    src={archivoUrl}
                    controls
                    className="w-full max-h-96 rounded-xl border-2 border-[#E2E8F0] bg-black"
                    preload="metadata"
                  >
                    Tu navegador no soporta videos.
                  </video>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={archivoUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg backdrop-blur-sm transition-all"
                      title="Descargar video"
                    >
                      <Download size={16} />
                    </a>
                  </div>

                  <p className="text-xs text-[#718096] mt-2 truncate">{archivo.nombre}</p>
                </div>
              );
            }

            const IconoTipo = getIconoArchivo(archivo.tipo);
            return (
              <a
                key={index}
                href={archivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#F7FAFC] to-[#EDF2F7] rounded-xl border-2 border-[#E2E8F0] hover:border-[#00B9F0] hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <IconoTipo size={24} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#2D3748] truncate group-hover:text-[#00B9F0] transition-colors">
                    {archivo.nombre}
                  </p>

                  <p className="text-xs text-[#718096] capitalize">
                    {archivo.tipo === "pdf" ? "Documento PDF" : archivo.tipo}
                  </p>
                </div>

                <ExternalLink
                  className="text-[#718096] group-hover:text-[#00B9F0] transition-colors"
                  size={20}
                />
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMensaje = (mensaje, esRespuesta = false) => {
    const esAutor = usuarioActual?._id === mensaje.usuarioId?._id;
    const tieneRespuestas = mensaje.respuestas && mensaje.respuestas.length > 0;
    const avatarUrl = getAvatarUrl(mensaje.usuarioId);

    return (
      <div
        key={mensaje._id}
        className={`${esRespuesta ? 'ml-8 lg:ml-16' : ''} ${
          esRespuesta ? 'border-l-4 border-[#00B9F0]/30 pl-6' : ''
        }`}
      >
        <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all">
          <div className="bg-gradient-to-r from-[#F7FAFC] to-[#EDF2F7] p-4 lg:p-6 border-b border-[#E2E8F0]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF0080] via-[#7928CA] via-[#FF0080] via-[#FF8C00] to-[#FFD700] p-[3px] animate-rainbow">
                      <div className="w-full h-full rounded-full bg-white p-[2px]">
                        <img
                          src={avatarUrl}
                          alt={mensaje.usuarioId?.nombre}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF0080] via-[#7928CA] via-[#FF0080] via-[#FF8C00] to-[#FFD700] p-[3px] animate-rainbow">
                      <div className="w-full h-full rounded-full bg-white p-[2px]">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {mensaje.usuarioId?.nombre?.[0]?.toUpperCase() || 'U'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[#2D3748] text-base">
                      {mensaje.usuarioId?.nombre || 'Usuario'}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRolBadgeColor(
                        mensaje.usuarioId?.rol
                      )}`}
                    >
                      {mensaje.usuarioId?.rol || 'Usuario'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#718096] mt-1">
                    <Clock size={12} />
                    <span>
                      {new Date(mensaje.fechaCreacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {esAutor && (
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModalEdicion(mensaje)}
                    className="w-9 h-9 bg-[#00B9F0]/10 hover:bg-[#00B9F0] text-[#00B9F0] hover:text-white rounded-lg transition-all flex items-center justify-center"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => eliminarMensaje(mensaje._id)}
                    className="w-9 h-9 bg-[#FA6D00]/10 hover:bg-[#FA6D00] text-[#FA6D00] hover:text-white rounded-lg transition-all flex items-center justify-center"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 lg:p-6">
            <p className="text-[#2D3748] leading-relaxed whitespace-pre-wrap mb-4">
              {mensaje.contenido}
            </p>

            {renderArchivosAdjuntos(mensaje.archivos)}

            <div className="flex items-center gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => toggleLike(mensaje._id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  Array.isArray(mensaje.likes) && mensaje.likes.includes(usuarioActual?._id)
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg'
                    : 'bg-[#E2E8F0] text-[#718096] hover:bg-gradient-to-r hover:from-[#00B9F0] hover:to-[#01C9F4] hover:text-white'
                } ${likesAnimando[mensaje._id] ? 'animate-rainbow-pulse' : ''}`}
              >
                <ThumbsUp 
                  size={16} 
                  className={likesAnimando[mensaje._id] ? 'animate-like-bounce' : ''}
                />
                <span>{Array.isArray(mensaje.likes) ? mensaje.likes.length : 0}</span>
              </button>

              {foro?.estado === 'abierto' && (
                <button
                  onClick={() => abrirModalRespuesta(mensaje)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#E2E8F0] hover:bg-[#7AD107] text-[#718096] hover:text-white rounded-lg font-semibold transition-all"
                >
                  <Reply size={16} />
                  Responder
                </button>
              )}

              {tieneRespuestas && (
                <span className="ml-auto text-sm text-[#718096] font-semibold">
                  {mensaje.respuestas.length}{' '}
                  {mensaje.respuestas.length === 1 ? 'respuesta' : 'respuestas'}
                </span>
              )}
            </div>
          </div>
        </div>

        {tieneRespuestas && (
          <div className="mt-4 space-y-4">
            {mensaje.respuestas.map(respuesta => renderMensaje(respuesta, true))}
          </div>
        )}
      </div>
    );
  };

  const navegarA = (ruta) => {
    if (typeof window !== 'undefined') {
      window.location.href = `${ruta}?cursoId=${cursoId}`;
    }
  };

  if (loading) {
    return <LoadingScreen mensaje="Cargando foro..." />;
  }

  if (!foro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#FA6D00]/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-[#FA6D00]" size={48} />
          </div>
          <p className="text-[#2D3748] text-xl font-bold">Foro no encontrado</p>
        </div>
      </div>
    );
  }

  const mensajesPrincipales = mensajes.filter(m => !m.respuestaA);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white shadow-md border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-[#718096] hover:text-[#00B9F0] transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white group-hover:bg-[#01C9F4] transition-all">
                  <ArrowLeft size={18} />
                </div>
                <span className="font-semibold text-sm hidden sm:inline">Volver</span>
              </button>
              <div className="h-8 w-px bg-[#E2E8F0]"></div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                  <MessageCircle size={18} />
                </div>
                <h1 className="text-base lg:text-lg font-bold text-[#2D3748]">Foro</h1>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navegarA('/profesor/cursos/informacion')}
                className="w-10 h-10 bg-[#E2E8F0] hover:bg-[#00B9F0] hover:text-white text-[#718096] rounded-lg transition-all flex items-center justify-center"
                title="Información del curso"
              >
                <Home size={18} />
              </button>
              <button
                onClick={() => navegarA('/profesor/cursos/crear/modulos')}
                className="w-10 h-10 bg-[#E2E8F0] hover:bg-[#00B9F0] hover:text-white text-[#718096] rounded-lg transition-all flex items-center justify-center"
                title="Módulos"
              >
                <BookOpen size={18} />
              </button>
              <button
                onClick={() => navegarA('/profesor/cursos/crear/modulos/tareas')}
                className="w-10 h-10 bg-[#E2E8F0] hover:bg-[#00B9F0] hover:text-white text-[#718096] rounded-lg transition-all flex items-center justify-center"
                title="Tareas"
              >
                <ClipboardList size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MessageCircle size={24} />
                </div>
                <h1 className="text-2xl lg:text-4xl font-bold">{foro.titulo}</h1>
              </div>
              <p className="text-white/95 text-base lg:text-lg mb-4 leading-relaxed">
                {foro.descripcion}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${foro.estado === 'abierto'
                  ? 'bg-[#7AD107] text-white shadow-md'
                  : 'bg-white/20 text-white backdrop-blur-sm'
                  }`}>
                  {foro.estado === 'abierto' ? <Unlock size={16} /> : <Lock size={16} />}
                  {foro.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold">
                  {mensajes.length} {mensajes.length === 1 ? 'mensaje' : 'mensajes'}
                </span>
              </div>
            </div>

            {foro.estado === 'abierto' && (
              <button
                onClick={() => abrirModalRespuesta()}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#F7FAFC] text-[#00B9F0] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Send size={20} />
                <span className="hidden sm:inline">Nuevo Mensaje</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
        {mensajesPrincipales.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-12 lg:p-20 text-center">
            <div className="w-24 h-24 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="text-[#718096]" size={48} />
            </div>
            <p className="text-[#2D3748] text-xl font-bold mb-3">
              No hay mensajes aún
            </p>
            <p className="text-[#718096] text-base mb-6">
              Sé el primero en participar en esta discusión
            </p>
            {foro.estado === 'abierto' && (
              <button
                onClick={() => abrirModalRespuesta()}
                className="inline-flex items-center gap-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Send size={20} />
                Escribir Primer Mensaje
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {mensajesPrincipales.map(mensaje => renderMensaje(mensaje))}
          </div>
        )}
      </div>

      {modalRespuesta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#00B9F0] to-[#01C9F4] text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    {modoEdicion ? <Edit size={20} /> : <Send size={20} />}
                  </div>
                  <h2 className="text-2xl font-bold">
                    {modoEdicion ? 'Editar Mensaje' : respuestaA ? 'Responder' : 'Nuevo Mensaje'}
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

            {enviando ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 border-4 border-[#00B9F0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#2D3748] font-semibold text-lg">Enviando mensaje...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {respuestaA && (
                  <div className="p-4 bg-[#00B9F0]/5 border-l-4 border-[#00B9F0] rounded-lg">
                    <p className="text-sm text-[#00B9F0] font-bold mb-2 flex items-center gap-2">
                      <Reply size={14} />
                      Respondiendo a {respuestaA.usuarioId?.nombre}:
                    </p>
                    <p className="text-sm text-[#718096] line-clamp-3">
                      {respuestaA.contenido}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-[#2D3748] mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#00B9F0] focus:border-[#00B9F0] resize-none transition-all"
                    maxLength={1500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-[#718096]">
                      {contenido.length}/1500 caracteres
                    </p>
                    {contenido.length > 1400 && (
                      <p className="text-xs text-[#FA6D00] font-semibold">
                        ¡Cerca del límite!
                      </p>
                    )}
                  </div>
                </div>

                {!modoEdicion && (
                  <div>
                    <label className="block text-sm font-bold text-[#2D3748] mb-2">
                      Archivos Adjuntos (Máximo 5)
                    </label>
                    <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-8 text-center hover:border-[#00B9F0] transition-all bg-[#F7FAFC]">
                      <input
                        type="file"
                        id="archivos-mensaje"
                        multiple
                        accept="image/*,video/*,application/pdf"
                        onChange={handleArchivosChange}
                        className="hidden"
                        disabled={archivos.length >= 5}
                      />
                      <label
                        htmlFor="archivos-mensaje"
                        className={`cursor-pointer ${archivos.length >= 5 ? 'opacity-50' : ''}`}
                      >
                        <div className="w-16 h-16 rounded-full bg-[#00B9F0]/10 flex items-center justify-center mx-auto mb-3">
                          <Paperclip className="text-[#00B9F0]" size={32} />
                        </div>
                        <p className="text-[#2D3748] font-bold mb-1">
                          {archivos.length >= 5
                            ? 'Límite de archivos alcanzado'
                            : 'Adjuntar archivos'}
                        </p>
                        <p className="text-xs text-[#718096]">
                          Imágenes, videos y PDFs hasta 10MB
                        </p>
                      </label>
                    </div>

                    {previsualizaciones.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-bold text-[#2D3748]">
                          Archivos seleccionados ({previsualizaciones.length}/5)
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                          {previsualizaciones.map((prev, index) => {
                            if (prev.tipo === 'imagen') {
                              return (
                                <div key={index} className="relative group">
                                  <img
                                    src={prev.url}
                                    alt={prev.nombre}
                                    className="w-full max-h-48 object-contain rounded-xl border-2 border-[#E2E8F0]"
                                  />
                                  <button
                                    onClick={() => eliminarArchivo(index)}
                                    className="absolute top-2 right-2 w-8 h-8 bg-[#FA6D00] hover:bg-[#FA6D00]/90 text-white rounded-lg transition-all flex items-center justify-center shadow-lg"
                                  >
                                    <X size={16} />
                                  </button>
                                  <p className="text-xs text-[#718096] mt-2 truncate">{prev.nombre}</p>
                                </div>
                              );
                            }

                            if (prev.tipo === 'video') {
                              return (
                                <div key={index} className="relative group">
                                  <video
                                    src={prev.url}
                                    className="w-full max-h-48 rounded-xl border-2 border-[#E2E8F0] bg-black"
                                    controls
                                  />
                                  <button
                                    onClick={() => eliminarArchivo(index)}
                                    className="absolute top-2 right-2 w-8 h-8 bg-[#FA6D00] hover:bg-[#FA6D00]/90 text-white rounded-lg transition-all flex items-center justify-center shadow-lg"
                                  >
                                    <X size={16} />
                                  </button>
                                  <p className="text-xs text-[#718096] mt-2 truncate">{prev.nombre}</p>
                                </div>
                              );
                            }

                            const IconoTipo = getIconoArchivo(prev.tipo);
                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-[#F7FAFC] to-[#EDF2F7] rounded-xl border-2 border-[#E2E8F0]"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                                    <IconoTipo size={24} />
                                  </div>
                                  <span className="text-sm text-[#2D3748] font-medium truncate">
                                    {prev.nombre}
                                  </span>
                                </div>
                                <button
                                  onClick={() => eliminarArchivo(index)}
                                  className="w-9 h-9 hover:bg-[#FA6D00]/10 text-[#FA6D00] rounded-lg transition-all flex items-center justify-center flex-shrink-0"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button
                    onClick={cerrarModal}
                    className="flex-1 px-6 py-3 bg-[#E2E8F0] hover:bg-[#718096] text-[#2D3748] hover:text-white rounded-xl font-bold transition-all"
                    disabled={enviando}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={enviarMensaje}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00B9F0] to-[#01C9F4] hover:from-[#01C9F4] hover:to-[#00B9F0] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                    disabled={enviando || !contenido.trim()}
                  >
                    {enviando ? 'Enviando...' : modoEdicion ? 'Actualizar' : 'Enviar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {imagenExpandida && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setImagenExpandida(null)}
        >
          <button
            onClick={() => setImagenExpandida(null)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all flex items-center justify-center backdrop-blur-sm"
          >
            <X size={24} />
          </button>

          <img
            src={imagenExpandida}
            alt="Imagen expandida"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          <a
            href={imagenExpandida}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 px-6 py-3 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={20} />
            Descargar
          </a>
        </div>
      )}
    </div>
  );
};

export default ForoRespuestasPage;