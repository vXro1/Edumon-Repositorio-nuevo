'use client';

import React, { useState, useEffect } from 'react';
import { Upload, UserPlus, Download, FileText, Trash2, Search, X, Home, BookOpen, Loader2, ArrowLeft, CheckCircle, AlertCircle, Info, Eye, Mail, Phone, Badge } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-edumon.onrender.com';

// Componente de Loading Screen
import LoadingScreen from '@/components/LoadingScreen';

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
  const [modalParticipante, setModalParticipante] = useState(null);

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

  const getAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
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
      
      // Obtener participantes con fotos
      try {
        const participantesRes = await fetch(`${API_BASE_URL}/cursos/${id}/participantes`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (participantesRes.ok) {
          const participantesData = await participantesRes.json();
          const participantesFormateados = participantesData.participantes || participantesData;
          
          const participantesMapeados = participantesFormateados
            .filter(p => p.rol === 'padre')
            .map(p => ({
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
                fotoPerfilUrl: p.fotoPerfilUrl,
                contraseña: p.contraseña
              }
            }));

          setPadres(participantesMapeados);
          setPadresFiltrados(participantesMapeados);
        } else {
          const padresData = data.curso.participantes.filter(p => p.usuarioId.rol === 'padre');
          setPadres(padresData);
          setPadresFiltrados(padresData);
        }
      } catch (error) {
        const padresData = data.curso.participantes.filter(p => p.usuarioId.rol === 'padre');
        setPadres(padresData);
        setPadresFiltrados(padresData);
      }
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
            tipo: 'advertencia',
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

  const handleNavigarInfo = () => {
    window.location.href = `/profesor/cursos/informacion?cursoId=${cursoId}`;
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

  if (cargando && !modal) {
    return <LoadingScreen mensaje={mensajeCarga} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
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
                  <UserPlus size={18} />
                </div>
                <h1 className="text-base sm:text-lg font-bold text-[#2D3748]">Registro de Padres</h1>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => window.location.href = '/profesor'}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#E2E8F0] hover:bg-[#718096] text-[#2D3748] hover:text-white rounded-lg transition-all text-sm font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Home size={16} className="text-white" />
                </div>
                <span className="hidden sm:inline">Inicio</span>
              </button>
              <button
                onClick={handleNavigarInfo}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#01C9F4] hover:bg-[#00B9F0] text-white rounded-lg transition-all text-sm font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Info size={16} className="text-white" />
                </div>
                <span className="hidden sm:inline">Info</span>
              </button>
              <button
                onClick={() => window.location.href = `/profesor/cursos/crear/modulos?cursoId=${cursoId}`}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all text-sm font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <BookOpen size={16} className="text-white" />
                </div>
                <span className="hidden sm:inline">Módulos</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Banner del curso */}
        {curso && (
          <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#00B9F0] flex items-center justify-center text-white">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2D3748]">{curso.nombre}</h2>
                <p className="text-[#718096]">{curso.descripcion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#FE327B]/10 border-l-4 border-[#FE327B] p-4 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#FE327B] flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#FE327B] font-medium flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-[#FE327B] hover:bg-[#FE327B]/10 rounded-lg p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Registro Individual */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#00B9F0] flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2D3748]">Registro Individual</h3>
                <p className="text-sm text-[#718096]">Agrega un padre a la vez</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2D3748] mb-2">Nombre</label>
                  <input
                    placeholder="María"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border-2 border-[#E2E8F0] p-3 rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-[#00B9F0] outline-none transition-all"
                    disabled={cargando}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2D3748] mb-2">Apellido</label>
                  <input
                    placeholder="González"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    className="w-full border-2 border-[#E2E8F0] p-3 rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-[#00B9F0] outline-none transition-all"
                    disabled={cargando}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">Teléfono (WhatsApp)</label>
                <input
                  placeholder="3001234567"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full border-2 border-[#E2E8F0] p-3 rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-[#00B9F0] outline-none transition-all"
                  disabled={cargando}
                />
                <p className="text-xs text-[#718096] mt-2">Se enviará notificación por WhatsApp</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-2">Cédula (contraseña)</label>
                <input
                  type="password"
                  placeholder="Ingrese cédula"
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                  className="w-full border-2 border-[#E2E8F0] p-3 rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-[#00B9F0] outline-none transition-all"
                  disabled={cargando}
                />
                <p className="text-xs text-[#718096] mt-2">Se usará como contraseña de acceso</p>
              </div>
            </div>
            
            <button 
              onClick={() => registrarPadre(false)}
              disabled={cargando || !form.nombre || !form.apellido || !form.telefono || !form.cedula}
              className="mt-6 w-full bg-[#00B9F0] hover:bg-[#01C9F4] text-white py-3 rounded-lg font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {cargando ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
              {cargando ? 'Registrando...' : 'Registrar Padre'}
            </button>
          </div>

          {/* Registro Masivo */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#7AD107] flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2D3748]">Registro Masivo</h3>
                <p className="text-sm text-[#718096]">Carga múltiples padres con CSV</p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-[#01C9F4]/5 rounded-lg border border-[#01C9F4]/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#01C9F4] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-[#2D3748]">Paso 1: Descarga plantilla</h4>
              </div>
              <p className="text-sm text-[#718096] mb-3">Formato: nombre, apellido, telefono, cedula</p>
              <button
                onClick={descargarPlantillaCSV}
                disabled={cargando}
                className="w-full bg-[#01C9F4] hover:bg-[#00B9F0] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Download className="w-5 h-5 text-white" />
                Descargar Plantilla
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                Paso 2: Sube tu archivo CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={cargando}
                className="w-full border-2 border-dashed border-[#E2E8F0] p-4 rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#7AD107] file:text-white hover:file:bg-[#7AD107]/90 transition-all hover:border-[#00B9F0]"
              />
              {file && (
                <div className="mt-3 p-3 bg-[#7AD107]/10 border border-[#7AD107]/20 rounded-lg flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#7AD107] flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-[#7AD107] font-medium">{file.name}</span>
                </div>
              )}
              <p className="text-xs text-[#718096] mt-2">
                Se enviará notificación WhatsApp a cada padre registrado
              </p>
            </div>
            
            <button 
              onClick={subirCSV}
              disabled={cargando || !file}
              className="w-full bg-[#7AD107] hover:bg-[#7AD107]/90 text-white py-3 rounded-lg font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {cargando ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Upload className="w-5 h-5 text-white" />}
              {cargando ? 'Procesando...' : 'Subir y Registrar'}
            </button>
          </div>
        </div>

        {/* Lista de padres */}
        <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#00B9F0] flex items-center justify-center">
                <span className="text-white font-bold text-lg">{padresFiltrados.length}</span>
              </div>
              <h3 className="text-xl font-bold text-[#2D3748]">Padres Registrados</h3>
            </div>
            
            {padres.length > 0 && (
              <button
                onClick={eliminarTodosPadres}
                disabled={cargando}
                className="flex items-center gap-2 bg-[#FE327B] hover:bg-[#FE327B]/90 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all"
              >
                <Trash2 className="w-4 h-4 text-white" />
                Eliminar Todos
              </button>
            )}
          </div>

          {padres.length > 0 && (
            <div className="mb-6 relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Search className="text-[#718096] w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-[#00B9F0] outline-none transition-all"
              />
            </div>
          )}

          {padresFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-10 h-10 text-[#718096]" />
              </div>
              <p className="text-[#718096] text-lg font-medium">
                {busqueda ? 'No se encontraron resultados' : 'Aún no hay padres registrados'}
              </p>
              {!busqueda && (
                <p className="text-[#718096] text-sm mt-2">Comienza registrando padres de familia</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {padresFiltrados.map((p) => {
                const avatarUrl = getAvatarUrl(p.usuarioId?.fotoPerfilUrl);
                const inicial = (p.usuarioId?.nombre?.[0] || 'U').toUpperCase();

                return (
                  <div
                    key={p.usuarioId._id}
                    className="p-4 bg-[#F7FAFC] rounded-xl border border-[#E2E8F0] hover:border-[#00B9F0]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={p.usuarioId?.nombre}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#00B9F0]/20"
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
                          {inicial}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#2D3748] text-lg truncate">
                            {p.usuarioId.nombre} {p.usuarioId.apellido}
                          </h4>
                          <div className="text-sm text-[#718096] space-y-1">
                            <p className="flex items-center gap-2 truncate">
                              <Phone size={14} />
                              {p.usuarioId.telefono}
                            </p>
                            <p className="flex items-center gap-2 truncate">
                              <Mail size={14} />
                              {p.usuarioId.correo}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModalParticipante(p)}
                          className="w-10 h-10 bg-[#00B9F0] hover:bg-[#01C9F4] rounded-lg flex items-center justify-center transition-all shadow-sm"
                          title="Ver información"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => eliminarPadre(p.usuarioId._id, `${p.usuarioId.nombre} ${p.usuarioId.apellido}`)}
                          disabled={cargando}
                          className="w-10 h-10 bg-[#FE327B] hover:bg-[#FE327B]/90 rounded-lg flex items-center justify-center transition-all shadow-sm"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Información del Participante */}
        {modalParticipante && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Header del Modal */}
              <div className="sticky top-0 bg-[#00B9F0] text-white p-6 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold">Información del Padre</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalParticipante(null)}
                    className="w-10 h-10 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6 space-y-6">
                {/* Avatar y nombre */}
                <div className="flex flex-col items-center text-center space-y-4">
                  {(() => {
                    const avatarUrl = getAvatarUrl(modalParticipante.usuarioId?.fotoPerfilUrl);
                    const inicial = (modalParticipante.usuarioId?.nombre?.[0] || 'U').toUpperCase();

                    return avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`Avatar de ${modalParticipante.usuarioId?.nombre || 'Usuario'}`}
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#00B9F0]/20 shadow-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                        {inicial}
                      </div>
                    );
                  })()}

                  <div>
                    <p className="text-2xl font-bold text-[#2D3748] mb-2">
                      {modalParticipante.usuarioId?.nombre || 'Sin nombre'}{' '}
                      {modalParticipante.usuarioId?.apellido || ''}
                    </p>
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#7AD107]/10 text-[#7AD107] border border-[#7AD107]/20">
                      Padre de Familia
                    </span>
                  </div>
                </div>

                <div className="h-px bg-[#E2E8F0]"></div>

                {/* Información detallada */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#00B9F0]/10 flex items-center justify-center flex-shrink-0">
                      <Badge className="text-[#00B9F0] w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#718096] font-semibold mb-1">ID</p>
                      <p className="text-sm text-[#2D3748] font-medium break-all">
                        {modalParticipante.usuarioId?._id || modalParticipante._id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#7AD107]/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="text-[#7AD107] w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#718096] font-semibold mb-1">Correo</p>
                      <p className="text-sm text-[#2D3748] font-medium break-all">
                        {modalParticipante.usuarioId?.correo || 'Sin correo'}
                      </p>
                    </div>
                  </div>

                  {modalParticipante.usuarioId?.telefono && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#01C9F4]/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="text-[#01C9F4] w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#718096] font-semibold mb-1">Teléfono</p>
                        <p className="text-sm text-[#2D3748] font-medium">
                          {modalParticipante.usuarioId.telefono}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex justify-end">
                <button
                  onClick={() => setModalParticipante(null)}
                  className="px-6 py-3 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-semibold shadow-md"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modales de Confirmación */}
        {modal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              {/* Header del Modal */}
              <div className={`p-6 rounded-t-2xl text-white ${
                modal.tipo === 'exito' ? 'bg-[#7AD107]' :
                modal.tipo === 'peligro' ? 'bg-[#FE327B]' :
                modal.tipo === 'advertencia' ? 'bg-[#FA6D00]' :
                'bg-[#00B9F0]'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    {modal.tipo === 'exito' ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : modal.tipo === 'peligro' ? (
                      <AlertCircle className="w-6 h-6 text-white" />
                    ) : modal.tipo === 'advertencia' ? (
                      <AlertCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Info className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <h2 className="text-2xl font-bold">{modal.titulo}</h2>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6">
                <p className="text-[#2D3748] text-base leading-relaxed whitespace-pre-line">
                  {modal.mensaje}
                </p>
              </div>

              {/* Footer del Modal */}
              <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0]">
                {modal.mostrarNavegacion ? (
                  <div className="space-y-2">
                    <button
                      onClick={handleNavigarModulos}
                      className="w-full flex items-center justify-center gap-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-md"
                    >
                      <BookOpen className="w-5 h-5 text-white" />
                      Continuar a Módulos
                    </button>
                    <button
                      onClick={handleNavigarInicio}
                      className="w-full flex items-center justify-center gap-2 bg-[#E2E8F0] hover:bg-[#718096] text-[#2D3748] hover:text-white px-4 py-3 rounded-lg font-semibold transition-all"
                    >
                      <Home className="w-5 h-5" />
                      Ir al Inicio
                    </button>
                  </div>
                ) : modal.accion ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setModal(null)}
                      className="flex-1 px-4 py-3 border-2 border-[#E2E8F0] rounded-lg font-semibold text-[#2D3748] hover:bg-[#F7FAFC] transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={modal.accion}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all shadow-md ${
                        modal.tipo === 'peligro' ? 'bg-[#FE327B] hover:bg-[#FE327B]/90' : 
                        modal.tipo === 'advertencia' ? 'bg-[#FA6D00] hover:bg-[#FA6D00]/90' :
                        'bg-[#00B9F0] hover:bg-[#01C9F4]'
                      }`}
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setModal(null)}
                    className="w-full px-4 py-3 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg font-semibold transition-all shadow-md"
                  >
                    Aceptar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}