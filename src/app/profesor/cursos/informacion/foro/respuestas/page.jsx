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
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';

const ForoRespuestasPage = () => {
  const [foro, setForo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [modalRespuesta, setModalRespuesta] = useState(false);
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  
  const [contenido, setContenido] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [previsualizaciones, setPrevisualizaciones] = useState([]);
  const [respuestaA, setRespuestaA] = useState(null);
  
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cursoId, setCursoId] = useState(null);
  const [foroId, setForoId] = useState(null);

  useEffect(() => {
    // Obtener parámetros de la URL solo en el cliente
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
      
      // Aplanar la estructura de mensajes con respuestas
      const mensajesAplanados = [];
      if (data.mensajes && Array.isArray(data.mensajes)) {
        data.mensajes.forEach(mensaje => {
          // Agregar mensaje principal
          mensajesAplanados.push({
            ...mensaje,
            respuestas: undefined // Remover respuestas anidadas
          });
          
          // Agregar respuestas como mensajes individuales con referencia
          if (mensaje.respuestas && Array.isArray(mensaje.respuestas)) {
            mensaje.respuestas.forEach(respuesta => {
              mensajesAplanados.push({
                ...respuesta,
                respuestaA: {
                  _id: mensaje._id,
                  contenido: mensaje.contenido,
                  usuarioId: mensaje.usuarioId
                }
              });
            });
          }
        });
      }
      
      setMensajes(mensajesAplanados);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar los mensajes');
    }
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
      const res = await fetch(`${API_BASE_URL}/mensajes-foro/${mensajeId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al dar like');

      await cargarMensajes();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
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

  const renderMensaje = (mensaje, esRespuesta = false) => {
    const esAutor = usuarioActual?._id === mensaje.usuarioId?._id;
    const tieneRespuestas = mensajes.some(m => m.respuestaA?._id === mensaje._id);
    const respuestas = mensajes.filter(m => m.respuestaA?._id === mensaje._id);

    return (
      <div key={mensaje._id} className={esRespuesta ? 'ml-8 mt-3' : 'mb-4'}>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {mensaje.usuarioId?.fotoPerfilUrl ? (
                  <img 
                    src={mensaje.usuarioId.fotoPerfilUrl} 
                    alt={mensaje.usuarioId.nombre}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {mensaje.usuarioId?.nombre} {mensaje.usuarioId?.apellido}
                  </span>
                  {mensaje.usuarioId?.rol === 'docente' && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                      Docente
                    </span>
                  )}
                  {mensaje.usuarioId?.rol === 'padre' && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                      Padre
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={12} />
                  {new Date(mensaje.fechaCreacion).toLocaleString('es-ES')}
                  {mensaje.editado && (
                    <span className="text-gray-400">(editado)</span>
                  )}
                </div>
              </div>
            </div>
            
            {esAutor && (
              <div className="flex gap-2">
                <button
                  onClick={() => abrirModalEdicion(mensaje)}
                  className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => eliminarMensaje(mensaje._id)}
                  className="p-1.5 hover:bg-red-50 text-red-600 rounded"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {mensaje.respuestaA && (
            <div className="mb-3 p-2 bg-gray-50 border-l-4 border-blue-400 rounded">
              <p className="text-xs text-blue-700 font-medium mb-1">
                Respondiendo a {mensaje.respuestaA.usuarioId?.nombre}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {mensaje.respuestaA.contenido}
              </p>
            </div>
          )}

          <p className="text-gray-700 mb-3 whitespace-pre-wrap">{mensaje.contenido}</p>

          {mensaje.archivos && mensaje.archivos.length > 0 && (
            <div className="mb-3 space-y-2">
              {mensaje.archivos.map((archivo, index) => {
                const IconoTipo = getIconoArchivo(archivo.tipo);
                return (
                  <a
                    key={index}
                    href={archivo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100"
                  >
                    <IconoTipo className="text-blue-600" size={18} />
                    <span className="text-sm text-gray-700 flex-1 truncate">
                      {archivo.nombre}
                    </span>
                  </a>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => toggleLike(mensaje._id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm ${
                mensaje.likedBy?.some(id => id === usuarioActual?._id)
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ThumbsUp size={14} />
              <span>{mensaje.likes || 0}</span>
            </button>
            
            {foro?.estado === 'abierto' && !esRespuesta && (
              <button
                onClick={() => abrirModalRespuesta(mensaje)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm"
              >
                <Reply size={14} />
                <span>Responder</span>
              </button>
            )}

            {tieneRespuestas && (
              <span className="text-sm text-gray-500 ml-auto">
                {respuestas.length} {respuestas.length === 1 ? 'respuesta' : 'respuestas'}
              </span>
            )}
          </div>
        </div>

        {respuestas.length > 0 && (
          <div className="mt-3 space-y-3">
            {respuestas.map(respuesta => renderMensaje(respuesta, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Cargando foro...</p>
        </div>
      </div>
    );
  }

  if (!foro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <p className="text-gray-700">Foro no encontrado</p>
        </div>
      </div>
    );
  }

  const mensajesPrincipales = mensajes.filter(m => !m.respuestaA);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft size={18} />
              <span className="font-medium text-sm">Volver</span>
            </button>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="text-blue-600" size={22} />
                <h1 className="text-xl font-bold text-gray-900">{foro.titulo}</h1>
              </div>
              <p className="text-gray-600 mb-2">{foro.descripcion}</p>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                  foro.estado === 'abierto'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {foro.estado === 'abierto' ? <Unlock size={12} /> : <Lock size={12} />}
                  {foro.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
                </span>
                <span className="text-sm text-gray-500">
                  {mensajes.length} {mensajes.length === 1 ? 'mensaje' : 'mensajes'}
                </span>
              </div>
            </div>

            {foro.estado === 'abierto' && (
              <button
                onClick={() => abrirModalRespuesta()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              >
                <Send size={18} />
                Nuevo Mensaje
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {mensajesPrincipales.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <MessageCircle className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-600 text-lg mb-2">
              No hay mensajes aún
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Sé el primero en participar en esta discusión
            </p>
            {foro.estado === 'abierto' && (
              <button
                onClick={() => abrirModalRespuesta()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded font-medium"
              >
                <Send size={18} />
                Escribir Primer Mensaje
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {mensajesPrincipales.map(mensaje => renderMensaje(mensaje))}
          </div>
        )}
      </div>

      {modalRespuesta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send size={24} />
                  <h2 className="text-xl font-bold">
                    {modoEdicion ? 'Editar Mensaje' : respuestaA ? 'Responder' : 'Nuevo Mensaje'}
                  </h2>
                </div>
                <button
                  onClick={cerrarModal}
                  className="p-1.5 hover:bg-blue-700 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {respuestaA && (
                <div className="p-3 bg-gray-50 border-l-4 border-blue-400 rounded">
                  <p className="text-sm text-blue-700 font-medium mb-1">
                    Respondiendo a {respuestaA.usuarioId?.nombre}:
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {respuestaA.contenido}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  maxLength={1500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {contenido.length}/1500 caracteres
                </p>
              </div>

              {!modoEdicion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivos Adjuntos (Máximo 5)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center hover:border-blue-400">
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
                      <Paperclip className="mx-auto text-gray-400 mb-2" size={40} />
                      <p className="text-gray-600 font-medium mb-1">
                        {archivos.length >= 5 
                          ? 'Límite de archivos alcanzado' 
                          : 'Adjuntar archivos'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Imágenes, videos y PDFs hasta 10MB
                      </p>
                    </label>
                  </div>

                  {previsualizaciones.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {previsualizaciones.map((prev, index) => {
                        const IconoTipo = getIconoArchivo(prev.tipo);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                          >
                            <div className="flex items-center gap-2">
                              <IconoTipo className="text-blue-600" size={18} />
                              <span className="text-sm text-gray-700 truncate max-w-xs">
                                {prev.nombre}
                              </span>
                            </div>
                            <button
                              onClick={() => eliminarArchivo(index)}
                              className="p-1 hover:bg-red-100 text-red-600 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
                  disabled={enviando}
                >
                  Cancelar
                </button>
                <button
                  onClick={enviarMensaje}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
                  disabled={enviando || !contenido.trim()}
                >
                  {enviando ? 'Enviando...' : modoEdicion ? 'Actualizar' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForoRespuestasPage;