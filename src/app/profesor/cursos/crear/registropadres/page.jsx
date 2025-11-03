'use client';

import React, { useState, useEffect } from 'react';
import { Upload, UserPlus, Download, FileText, Trash2, Search, X, Home, BookOpen, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';

export default function RegistroPadresPage() {
  const [cursoId, setCursoId] = useState('');
  const [curso, setCurso] = useState(null);
  const [padres, setPadres] = useState([]);
  const [padresFiltrados, setPadresFiltrados] = useState([]);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [modal, setModal] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeCarga, setMensajeCarga] = useState('Procesando...');

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    cedula: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('cursoId');
    if (id) {
      setCursoId(id);
      obtenerCurso(id);
    }
  }, []);

  useEffect(() => {
    if (busqueda.trim() === '') {
      setPadresFiltrados(padres);
    } else {
      const resultado = padres.filter(p => {
        const nombreCompleto = `${p.usuarioId.nombre} ${p.usuarioId.apellido}`.toLowerCase();
        const telefono = p.usuarioId.telefono?.toLowerCase() || '';
        const correo = p.usuarioId.correo?.toLowerCase() || '';
        const termino = busqueda.toLowerCase();
        
        return nombreCompleto.includes(termino) || 
               telefono.includes(termino) ||
               correo.includes(termino);
      });
      setPadresFiltrados(resultado);
    }
  }, [busqueda, padres]);

  const formatearTelefono = (telefono) => {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    if (telefonoLimpio.startsWith('57')) {
      return `+${telefonoLimpio}`;
    }
    if (telefonoLimpio.startsWith('3')) {
      return `+57${telefonoLimpio}`;
    }
    return `+57${telefonoLimpio}`;
  };

  const obtenerCurso = async (id) => {
    try {
      setCargando(true);
      setMensajeCarga('Cargando información del curso...');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/cursos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('No se pudo obtener el curso');
      const data = await res.json();
      setCurso(data.curso);
      const padresData = data.curso.participantes.filter(p => p.usuarioId.rol === 'padre');
      setPadres(padresData);
      setPadresFiltrados(padresData);
    } catch (error) {
      setError('Error al cargar el curso');
    } finally {
      setCargando(false);
    }
  };

  const validarDuplicado = () => {
    const telefonoFormateado = formatearTelefono(form.telefono);
    const duplicado = padres.find(p => 
      formatearTelefono(p.usuarioId.telefono) === telefonoFormateado ||
      p.usuarioId.contraseña === form.cedula.trim()
    );
    
    if (duplicado) {
      setError(`Ya existe un padre con ese teléfono o cédula: ${duplicado.usuarioId.nombre} ${duplicado.usuarioId.apellido}`);
      return true;
    }
    return false;
  };

  const registrarPadre = async (forzar = false) => {
    setError('');

    if (!forzar && validarDuplicado()) {
      return;
    }

    try {
      setCargando(true);
      setMensajeCarga('Registrando padre de familia...');
      const token = localStorage.getItem('token');
      
      const body = { 
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: formatearTelefono(form.telefono),
        cedula: form.cedula.trim()
      };
      if (forzar) body.forzar = true;

      const res = await fetch(`${API_BASE_URL}/cursos/${cursoId}/participantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message && data.message.includes('otro curso') && !forzar) {
          setCargando(false);
          setModal({
            titulo: 'Padre ya registrado en otro curso',
            mensaje: `${form.nombre} ${form.apellido} ya pertenece a otro curso. ¿Desea inscribirlo en este curso también?`,
            accion: () => confirmarInscripcion()
          });
        } else {
          throw new Error(data.message || 'Error al registrar padre');
        }
      } else {
        setModal({
          titulo: 'Registro exitoso',
          mensaje: `${form.nombre} ${form.apellido} ha sido registrado correctamente. Se ha enviado una notificación por WhatsApp.`,
          tipo: 'exito',
          accion: () => setModal(null)
        });
        await obtenerCurso(cursoId);
        setForm({ nombre: '', apellido: '', telefono: '', cedula: '' });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };

  const confirmarInscripcion = async () => {
    try {
      setModal(null);
      await registrarPadre(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const eliminarPadre = async (usuarioId, nombreCompleto) => {
    setModal({
      titulo: 'Confirmar eliminación',
      mensaje: `¿Estás seguro de eliminar a ${nombreCompleto} del curso?`,
      tipo: 'peligro',
      accion: async () => {
        try {
          setModal(null);
          setCargando(true);
          setMensajeCarga('Eliminando padre...');
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE_URL}/cursos/${cursoId}/participantes/${usuarioId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Error al eliminar padre');
          }

          setModal({
            titulo: 'Eliminado',
            mensaje: `${nombreCompleto} ha sido eliminado exitosamente`,
            tipo: 'exito',
            accion: () => setModal(null)
          });
          await obtenerCurso(cursoId);
        } catch (error) {
          setError(error.message);
        } finally {
          setCargando(false);
        }
      }
    });
  };

  const eliminarTodosPadres = async () => {
    if (padres.length === 0) {
      return setError('No hay padres para eliminar');
    }

    setModal({
      titulo: 'Eliminar todos los padres',
      mensaje: `¿Estás seguro de eliminar TODOS los ${padres.length} padres del curso? Esta acción no se puede deshacer.`,
      tipo: 'peligro',
      accion: async () => {
        try {
          setModal(null);
          setCargando(true);
          setMensajeCarga(`Eliminando ${padres.length} padres...`);
          const token = localStorage.getItem('token');
          
          for (const padre of padres) {
            await fetch(`${API_BASE_URL}/cursos/${cursoId}/participantes/${padre.usuarioId._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
          }

          setModal({
            titulo: 'Eliminación masiva completada',
            mensaje: 'Todos los padres fueron eliminados exitosamente',
            tipo: 'exito',
            accion: () => setModal(null)
          });
          await obtenerCurso(cursoId);
        } catch (error) {
          setError('Error al eliminar padres: ' + error.message);
        } finally {
          setCargando(false);
        }
      }
    });
  };

  const descargarPlantillaCSV = () => {
    const headers = ['nombre', 'apellido', 'telefono', 'cedula'];
    const ejemplos = [
      ['María', 'González', '3001234567', '1234567890'],
      ['José', 'Rodríguez', '3009876543', '0987654321'],
      ['Ana', 'Martínez', '3157654321', '1122334455']
    ];

    const csvContent = [
      headers.join(','),
      ...ejemplos.map(fila => fila.join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_registro_padres.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const subirCSV = async () => {
    if (!file) {
      setError('Selecciona un archivo CSV primero');
      return;
    }

    try {
      setCargando(true);
      setMensajeCarga('Procesando archivo CSV y enviando notificaciones...');
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('archivoCSV', file);

      const res = await fetch(`${API_BASE_URL}/cursos/${cursoId}/usuarios-masivo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al subir archivo');
      }

      const mensaje = `Se han procesado los registros:\n\n${data.resumen.exitosos} padres agregados exitosamente\n${data.resumen.duplicados > 0 ? `${data.resumen.duplicados} padres ya estaban registrados\n` : ''}${data.resumen.errores > 0 ? `${data.resumen.errores} errores encontrados\n` : ''}\nSe han enviado notificaciones por WhatsApp a los nuevos registros.`;
      
      await obtenerCurso(cursoId);
      setFile(null);
      
      setModal({
        titulo: 'Carga masiva completada',
        mensaje: mensaje,
        tipo: 'exito',
        mostrarNavegacion: true
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };

  const handleNavigarModulos = () => {
    setModal(null);
    window.location.href = `/profesor/cursos/crear/modulos?cursoId=${cursoId}`;
  };

  const handleNavigarInicio = () => {
    setModal(null);
    window.location.href = '/profesor';
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setError('Por favor selecciona un archivo CSV válido');
        setFile(null);
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="font-medium text-sm">Volver</span>
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/profesor'}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all shadow-sm"
              >
                <Home size={16} />
                <span className="hidden sm:inline text-sm">Inicio</span>
              </button>
              <button
                onClick={() => window.location.href = `/profesor/cursos/crear/modulos?cursoId=${cursoId}`}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
              >
                <BookOpen size={16} />
                <span className="hidden sm:inline text-sm">Módulos</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Registro de Padres de Familia
            </h1>
            {curso && (
              <p className="text-gray-600 flex items-center gap-2">
                <BookOpen size={18} />
                <span>Curso: <strong>{curso.nombre}</strong></span>
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
              <button onClick={() => setError('')} className="ml-auto text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Registro Individual */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Registro Individual</h3>
                <p className="text-sm text-gray-500">Agrega un padre a la vez</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    placeholder="María"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={cargando}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    placeholder="González"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={cargando}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
                <input
                  placeholder="3001234567"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={cargando}
                />
                <p className="text-xs text-gray-500 mt-1">Se enviará notificación por WhatsApp</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula (contraseña)</label>
                <input
                  type="password"
                  placeholder="Ingrese cédula"
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                  className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={cargando}
                />
                <p className="text-xs text-gray-500 mt-1">Se usará como contraseña de acceso</p>
              </div>
            </div>
            
            <button 
              onClick={() => registrarPadre(false)}
              disabled={cargando || !form.nombre || !form.apellido || !form.telefono || !form.cedula}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              {cargando ? 'Registrando...' : 'Registrar Padre'}
            </button>
          </div>

          {/* Registro Masivo */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Registro Masivo</h3>
                <p className="text-sm text-gray-500">Carga múltiples padres con CSV</p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-800">Paso 1: Descarga plantilla</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Formato: nombre, apellido, telefono, cedula</p>
              <button
                onClick={descargarPlantillaCSV}
                disabled={cargando}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar Plantilla
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Paso 2: Sube tu archivo CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={cargando}
                className="w-full border-2 border-dashed border-gray-300 p-3 rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
              />
              {file && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">{file.name}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Se enviará notificación WhatsApp a cada padre registrado
              </p>
            </div>
            
            <button 
              onClick={subirCSV}
              disabled={cargando || !file}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {cargando ? 'Procesando...' : 'Subir y Registrar'}
            </button>
          </div>
        </div>

        {/* Lista de padres */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">{padresFiltrados.length}</span>
              </div>
              Padres Registrados
            </h3>
            
            {padres.length > 0 && (
              <button
                onClick={eliminarTodosPadres}
                disabled={cargando}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Todos
              </button>
            )}
          </div>

          {padres.length > 0 && (
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {padresFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {busqueda ? 'No se encontraron resultados' : 'Aún no hay padres registrados'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {padresFiltrados.map((p) => (
                <div
                  key={p.usuarioId._id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">
                        {p.usuarioId.nombre} {p.usuarioId.apellido}
                      </h4>
                      <div className="text-sm text-gray-600 space-y-0.5">
                        <p>Teléfono: {p.usuarioId.telefono}</p>
                        <p>Correo: {p.usuarioId.correo}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarPadre(p.usuarioId._id, `${p.usuarioId.nombre} ${p.usuarioId.apellido}`)}
                      disabled={cargando}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de carga con fondo transparente */}
        {cargando && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full">
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Procesando</h3>
                <p className="text-gray-600 text-center text-sm">{mensajeCarga}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modales con fondo transparente */}
        {modal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
              <div className="mb-6">
                <h2 className="font-bold text-xl text-gray-800 mb-3">{modal.titulo}</h2>
                <p className="text-gray-600 whitespace-pre-line">{modal.mensaje}</p>
              </div>

              {modal.mostrarNavegacion ? (
                <div className="space-y-2">
                  <button
                    onClick={handleNavigarModulos}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold"
                  >
                    <BookOpen className="w-5 h-5" />
                    Continuar a Módulos
                  </button>
                  <button
                    onClick={handleNavigarInicio}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold"
                  >
                    <Home className="w-5 h-5" />
                    Ir al Inicio
                  </button>
                </div>
              ) : modal.accion ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={modal.accion}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-white ${
                      modal.tipo === 'peligro' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Confirmar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setModal(null)}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Aceptar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}