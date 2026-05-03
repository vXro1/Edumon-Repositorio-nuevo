'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Power, 
  PowerOff, 
  Home, 
  Users, 
  Info,
  BookOpen,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Upload,
  Download,
  FileText
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-edumon.onrender.com/api';

// Componente de Loading Screen
import LoadingScreen from '@/components/LoadingScreen';
const ModulosPage = () => {
  const [cursoId, setCursoId] = useState('');
  const [modulos, setModulos] = useState([]);
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: ''
  });
  const [errors, setErrors] = useState({});
  const [procesando, setProcesando] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);
  const [mensajeCarga, setMensajeCarga] = useState('Cargando módulos...');
  const [file, setFile] = useState(null);
  const [modalFormulario, setModalFormulario] = useState(false);
  const [modalCargaMasiva, setModalCargaMasiva] = useState(false);

  // Separar módulos por estado (excluyendo eliminados)
  const modulosActivos = modulos.filter(m => m.estado === 'activo' && !m.eliminado);
  const modulosInactivos = modulos.filter(m => m.estado === 'inactivo' && !m.eliminado);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('cursoId');
    
    if (!id) {
      alert('❌ No se especificó un curso');
      window.location.href = '/profesor';
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    setCursoId(id);
    cargarDatos(id);
  }, []);

  const cargarDatos = async (id) => {
    const token = localStorage.getItem('token');
    
    try {
      setLoading(true);
      setMensajeCarga('Cargando información del curso...');

      // Cargar información del curso
      const cursoRes = await fetch(`${API_BASE_URL}/cursos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!cursoRes.ok) {
        throw new Error('No se pudo cargar la información del curso');
      }

      const cursoData = await cursoRes.json();
      setCurso(cursoData.curso || cursoData);

      setMensajeCarga('Cargando módulos...');

      // Cargar módulos del curso
      const modulosRes = await fetch(`${API_BASE_URL}/modulos/curso/${id}?incluirInactivos=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (modulosRes.ok) {
        const modulosData = await modulosRes.json();
        const modulosNoEliminados = (modulosData.modulos || modulosData || []).filter(m => !m.eliminado);
        setModulos(modulosNoEliminados);
      } else {
        setModulos([]);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setModalConfirmacion({
        tipo: 'error',
        titulo: 'Error al cargar',
        mensaje: error.message,
        accion: () => setModalConfirmacion(null)
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    } else if (formData.titulo.length < 3 || formData.titulo.length > 200) {
      newErrors.titulo = 'El título debe tener entre 3 y 200 caracteres';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    } else if (formData.descripcion.length < 10 || formData.descripcion.length > 1000) {
      newErrors.descripcion = 'La descripción debe tener entre 10 y 1000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNuevoModulo = () => {
    setEditando(null);
    setFormData({ titulo: '', descripcion: '' });
    setErrors({});
    setModalFormulario(true);
  };

  const handleEditarModulo = (modulo) => {
    setEditando(modulo._id);
    setFormData({
      titulo: modulo.titulo,
      descripcion: modulo.descripcion
    });
    setErrors({});
    setModalFormulario(true);
  };

  const handleCancelar = () => {
    setModalFormulario(false);
    setModalCargaMasiva(false);
    setEditando(null);
    setFormData({ titulo: '', descripcion: '' });
    setErrors({});
    setFile(null);
  };

  const descargarPlantillaCSV = () => {
    const headers = ['titulo', 'descripcion', 'estado'];
    const ejemplos = [
      ['Prevención de la Violencia Sexual', 'Módulo sobre identificación y prevención de situaciones de riesgo', 'activo'],
      ['Comunicación Familiar Efectiva', 'Estrategias para mejorar la comunicación entre padres e hijos', 'activo'],
      ['Desarrollo Socioemocional', 'Herramientas para el desarrollo emocional de los niños', 'inactivo']
    ];

    const csvContent = [
      headers.join(','),
      ...ejemplos.map(fila => fila.map(campo => `"${campo}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_modulos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setModalConfirmacion({
          tipo: 'error',
          titulo: 'Archivo inválido',
          mensaje: 'Por favor selecciona un archivo CSV válido',
          accion: () => setModalConfirmacion(null)
        });
        setFile(null);
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  const subirCSV = async () => {
    if (!file) {
      setModalConfirmacion({
        tipo: 'error',
        titulo: 'Archivo requerido',
        mensaje: 'Selecciona un archivo CSV primero',
        accion: () => setModalConfirmacion(null)
      });
      return;
    }

    try {
      setProcesando(true);
      setMensajeCarga('Procesando archivo CSV...');
      setModalCargaMasiva(false);

      const token = localStorage.getItem('token');
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const text = e.target.result;
          
          // Eliminar BOM si existe
          const cleanText = text.replace(/^\uFEFF/, '');
          
          // Dividir en líneas y filtrar vacías
          const lines = cleanText.split(/\r?\n/).filter(line => line.trim());
          
          if (lines.length < 2) {
            throw new Error('El archivo CSV está vacío o no tiene datos');
          }
          
          // Saltar la primera línea (encabezados)
          const dataLines = lines.slice(1);
          
          let exitosos = 0;
          let errores = 0;
          const erroresDetalle = [];

          for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i].trim();
            if (!line) continue;

            try {
              // Parsear CSV simple considerando comillas
              const fields = [];
              let currentField = '';
              let inQuotes = false;
              
              for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  fields.push(currentField.trim());
                  currentField = '';
                } else {
                  currentField += char;
                }
              }
              // Agregar el último campo
              fields.push(currentField.trim());

              const titulo = fields[0] || '';
              const descripcion = fields[1] || '';
              const estado = fields[2] || 'activo';

              if (!titulo || !descripcion) {
                errores++;
                erroresDetalle.push(`Línea ${i + 2}: Faltan campos requeridos`);
                continue;
              }

              const res = await fetch(`${API_BASE_URL}/modulos`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  titulo: titulo,
                  descripcion: descripcion,
                  estado: estado.toLowerCase() === 'inactivo' ? 'inactivo' : 'activo',
                  cursoId
                })
              });

              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error al crear módulo');
              }

              exitosos++;
            } catch (error) {
              errores++;
              if (erroresDetalle.length < 5) {
                erroresDetalle.push(`Línea ${i + 2}: ${error.message}`);
              }
            }
          }

          setProcesando(false);

          // Mostrar resultado
          let mensaje = `Procesamiento completado:\n\n✅ ${exitosos} módulos creados exitosamente`;
          if (errores > 0) {
            mensaje += `\n❌ ${errores} errores encontrados`;
            if (erroresDetalle.length > 0) {
              mensaje += '\n\nPrimeros errores:\n' + erroresDetalle.join('\n');
            }
          }

          setModalConfirmacion({
            tipo: exitosos > 0 ? 'exito' : 'error',
            titulo: 'Carga masiva completada',
            mensaje: mensaje,
            accion: () => setModalConfirmacion(null)
          });

          setFile(null);
          cargarDatos(cursoId);

        } catch (error) {
          setProcesando(false);
          setModalConfirmacion({
            tipo: 'error',
            titulo: 'Error procesando archivo',
            mensaje: 'Error al procesar el archivo CSV: ' + error.message,
            accion: () => setModalConfirmacion(null)
          });
        }
      };

      reader.onerror = () => {
        setProcesando(false);
        setModalConfirmacion({
          tipo: 'error',
          titulo: 'Error',
          mensaje: 'Error al leer el archivo',
          accion: () => setModalConfirmacion(null)
        });
      };

      reader.readAsText(file, 'UTF-8');

    } catch (error) {
      setProcesando(false);
      setModalConfirmacion({
        tipo: 'error',
        titulo: 'Error en carga masiva',
        mensaje: error.message,
        accion: () => setModalConfirmacion(null)
      });
    }
  };

  const handleGuardar = async () => {
    if (!validateForm()) {
      return;
    }

    setProcesando(true);
    setMensajeCarga(editando ? 'Actualizando módulo...' : 'Creando módulo...');
    const token = localStorage.getItem('token');

    try {
      let res;
      
      if (editando) {
        res = await fetch(`${API_BASE_URL}/modulos/${editando}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/modulos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            cursoId,
            estado: 'activo'
          })
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar el módulo');
      }

      setModalConfirmacion({
        tipo: 'exito',
        titulo: 'Operación exitosa',
        mensaje: `Módulo ${editando ? 'actualizado' : 'creado'} exitosamente`,
        accion: () => setModalConfirmacion(null)
      });

      handleCancelar();
      cargarDatos(cursoId);

    } catch (error) {
      console.error('Error guardando módulo:', error);
      setModalConfirmacion({
        tipo: 'error',
        titulo: 'Error',
        mensaje: error.message,
        accion: () => setModalConfirmacion(null)
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleCambiarEstado = async (moduloId, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
    
    setModalConfirmacion({
      tipo: 'advertencia',
      titulo: 'Confirmar acción',
      mensaje: `¿Seguro que deseas ${accion} este módulo?`,
      accion: async () => {
        setModalConfirmacion(null);
        setProcesando(true);
        setMensajeCarga(`${accion === 'activar' ? 'Activando' : 'Desactivando'} módulo...`);
        const token = localStorage.getItem('token');

        try {
          const res = await fetch(`${API_BASE_URL}/modulos/${moduloId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error al cambiar el estado del módulo');
          }

          setModalConfirmacion({
            tipo: 'exito',
            titulo: 'Estado actualizado',
            mensaje: `Módulo ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`,
            accion: () => setModalConfirmacion(null)
          });

          cargarDatos(cursoId);

        } catch (error) {
          console.error('Error cambiando estado:', error);
          setModalConfirmacion({
            tipo: 'error',
            titulo: 'Error',
            mensaje: error.message,
            accion: () => setModalConfirmacion(null)
          });
        } finally {
          setProcesando(false);
        }
      },
      cancelar: true
    });
  };

  const handleEliminar = async (moduloId) => {
    setModalConfirmacion({
      tipo: 'peligro',
      titulo: 'Eliminar módulo',
      mensaje: '¿Estás seguro de eliminar este módulo? Esta acción cambiará su estado a inactivo.',
      accion: async () => {
        setModalConfirmacion(null);
        setProcesando(true);
        setMensajeCarga('Eliminando módulo...');
        const token = localStorage.getItem('token');

        try {
          const res = await fetch(`${API_BASE_URL}/modulos/${moduloId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error al eliminar el módulo');
          }

          setModalConfirmacion({
            tipo: 'exito',
            titulo: 'Módulo eliminado',
            mensaje: 'Módulo eliminado exitosamente',
            accion: () => setModalConfirmacion(null)
          });

          cargarDatos(cursoId);

        } catch (error) {
          console.error('Error eliminando módulo:', error);
          setModalConfirmacion({
            tipo: 'error',
            titulo: 'Error',
            mensaje: error.message,
            accion: () => setModalConfirmacion(null)
          });
        } finally {
          setProcesando(false);
        }
      },
      cancelar: true
    });
  };

  const ModuloCard = ({ modulo, index }) => (
    <div
      className={`bg-white rounded-2xl shadow-md border p-6 hover:shadow-lg transition-all ${
        modulo.estado === 'inactivo' ? 'border-[#E2E8F0] bg-[#F7FAFC]' : 'border-[#E2E8F0]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-base ${
              modulo.estado === 'activo' 
                ? 'bg-[#00B9F0] text-white' 
                : 'bg-[#E2E8F0] text-[#718096]'
            }`}>
              {index + 1}
            </span>
            <h3 className={`text-xl font-bold flex-1 min-w-0 ${
              modulo.estado === 'activo' ? 'text-[#2D3748]' : 'text-[#718096]'
            }`}>
              {modulo.titulo}
            </h3>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                modulo.estado === 'activo'
                  ? 'bg-[#7AD107]/10 text-[#7AD107] border border-[#7AD107]/20'
                  : 'bg-[#718096]/10 text-[#718096] border border-[#718096]/20'
              }`}
            >
              {modulo.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <p className={`text-base leading-relaxed mb-3 ${
            modulo.estado === 'activo' ? 'text-[#718096]' : 'text-[#718096]/70'
          }`}>
            {modulo.descripcion}
          </p>
          <p className="text-[#718096] text-sm">
            Creado: {new Date(modulo.fechaCreacion).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handleEditarModulo(modulo)}
            className="w-10 h-10 bg-[#00B9F0] hover:bg-[#01C9F4] rounded-lg transition-all flex items-center justify-center shadow-sm"
            title="Editar módulo"
          >
            <Edit2 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => handleCambiarEstado(modulo._id, modulo.estado)}
            className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center shadow-sm ${
              modulo.estado === 'activo'
                ? 'bg-[#FA6D00] hover:bg-[#FA6D00]/90'
                : 'bg-[#7AD107] hover:bg-[#7AD107]/90'
            }`}
            title={modulo.estado === 'activo' ? 'Desactivar' : 'Activar'}
          >
            {modulo.estado === 'activo' ? 
              <PowerOff className="w-4 h-4 text-white" /> : 
              <Power className="w-4 h-4 text-white" />
            }
          </button>
          <button
            onClick={() => handleEliminar(modulo._id)}
            className="w-10 h-10 bg-[#FE327B] hover:bg-[#FE327B]/90 rounded-lg transition-all flex items-center justify-center shadow-sm"
            title="Eliminar módulo"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading || (procesando && !modalConfirmacion)) {
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
                  <ArrowLeft size={18} className="text-white" />
                </div>
                <span className="font-semibold text-sm hidden sm:inline">Volver</span>
              </button>
              <div className="h-6 w-px bg-[#E2E8F0]"></div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#00B9F0] flex items-center justify-center">
                  <BookOpen size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[#2D3748]">
                    Módulos del Curso
                  </h1>
                  <p className="text-xs text-[#718096] hidden sm:block">
                    {curso?.nombre || 'Cargando...'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => window.location.href = '/profesor'}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#E2E8F0] hover:bg-[#718096] text-[#2D3748] hover:text-white rounded-lg transition-all text-sm font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Home size={16} />
                </div>
                <span className="hidden sm:inline">Inicio</span>
              </button>
              <button
                onClick={() => window.location.href = `/profesor/cursos/crear/registropadres?cursoId=${cursoId}`}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white rounded-lg transition-all text-sm font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Users size={16} className="text-white" />
                </div>
                <span className="hidden sm:inline">Registrar</span>
              </button>
              <button
                onClick={() => window.location.href = `/profesor/cursos/crear/modulos/tareas?cursoId=${cursoId}`}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#FE327B] hover:bg-[#FE327B]/90 text-white rounded-lg transition-all text-sm font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <ClipboardList size={16} className="text-white" />
                </div>
                <span className="hidden sm:inline">Tareas</span>
              </button>
              <button
                onClick={() => {
                  if (modulosActivos.length === 0) {
                    setModalConfirmacion({
                      tipo: 'advertencia',
                      titulo: 'Módulos requeridos',
                      mensaje: 'Debes tener al menos un módulo activo antes de ver la información del curso',
                      accion: () => setModalConfirmacion(null)
                    });
                    return;
                  }
                  window.location.href = `/profesor/cursos/informacion?cursoId=${cursoId}`;
                }}
                disabled={modulosActivos.length === 0}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  modulosActivos.length === 0
                    ? 'bg-[#E2E8F0] text-[#718096] cursor-not-allowed'
                    : 'bg-[#01C9F4] hover:bg-[#00B9F0] text-white'
                }`}
                title={modulosActivos.length === 0 ? 'Debes tener al menos un módulo activo' : 'Ver información del curso'}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Info size={16} />
                </div>
                <span className="hidden sm:inline">Info</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Banner del curso */}
        {curso && (
          <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#00B9F0] flex items-center justify-center">
                <BookOpen size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#2D3748]">{curso.nombre}</h2>
                <p className="text-[#718096]">{curso.descripcion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={handleNuevoModulo}
            className="flex items-center gap-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all font-semibold"
          >
            <Plus size={20} className="text-white" />
            Crear Nuevo Módulo
          </button>
          <button
            onClick={() => setModalCargaMasiva(true)}
            className="flex items-center gap-2 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all font-semibold"
          >
            <Upload size={20} className="text-white" />
            Carga Masiva CSV
          </button>
        </div>

        {/* Lista de módulos */}
        {modulos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-6">
              <BookOpen className="text-[#718096]" size={40} />
            </div>
            <p className="text-[#2D3748] text-xl font-bold mb-2">
              No hay módulos creados
            </p>
            <p className="text-[#718096] text-base mb-6">
              Crea tu primer módulo educativo para comenzar
            </p>
            <button
              onClick={handleNuevoModulo}
              className="inline-flex items-center gap-2 bg-[#00B9F0] hover:bg-[#01C9F4] text-white px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-semibold"
            >
              <Plus size={20} className="text-white" />
              Crear Módulo
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Módulos Activos */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-[#7AD107]/20"></div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#7AD107]/10 rounded-full border border-[#7AD107]/20">
                  <div className="w-6 h-6 rounded-full bg-[#7AD107] flex items-center justify-center">
                    <Power size={14} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-[#7AD107]">
                    Módulos Activos ({modulosActivos.length})
                  </h2>
                </div>
                <div className="flex-1 h-px bg-[#7AD107]/20"></div>
              </div>

              {modulosActivos.length === 0 ? (
                <div className="bg-[#7AD107]/5 border border-[#7AD107]/20 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#7AD107]/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-[#7AD107]" size={32} />
                  </div>
                  <p className="text-[#7AD107] text-base font-semibold">
                    No hay módulos activos. Los módulos activos son visibles para los padres de familia.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {modulosActivos.map((modulo, index) => (
                    <ModuloCard key={modulo._id} modulo={modulo} index={index} />
                  ))}
                </div>
              )}
            </div>

            {/* Módulos Inactivos */}
            {modulosInactivos.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-[#718096]/20"></div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#718096]/10 rounded-full border border-[#718096]/20">
                    <div className="w-6 h-6 rounded-full bg-[#718096] flex items-center justify-center">
                      <PowerOff size={14} className="text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-[#718096]">
                      Módulos Inactivos ({modulosInactivos.length})
                    </h2>
                  </div>
                  <div className="flex-1 h-px bg-[#718096]/20"></div>
                </div>

                <div className="grid gap-4">
                  {modulosInactivos.map((modulo, index) => (
                    <ModuloCard key={modulo._id} modulo={modulo} index={index} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-8 bg-[#00B9F0]/5 border border-[#00B9F0]/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center flex-shrink-0">
              <Info className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-base text-[#2D3748] font-semibold mb-3">
                Información importante
              </p>
              <ul className="space-y-2 text-sm text-[#718096]">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#7AD107] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                  <span><strong className="text-[#2D3748]">Activos:</strong> Visibles para los padres de familia</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#718096] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <PowerOff size={12} className="text-white" />
                  </div>
                  <span><strong className="text-[#2D3748]">Inactivos:</strong> Ocultos temporalmente, se pueden reactivar</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#FE327B] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trash2 size={12} className="text-white" />
                  </div>
                  <span><strong className="text-[#2D3748]">Eliminar:</strong> Cambia el módulo a estado inactivo (soft delete)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Formulario Crear/Editar */}
      {modalFormulario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-[#00B9F0] text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    {editando ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                  </div>
                  <h2 className="text-2xl font-bold">
                    {editando ? 'Editar Módulo' : 'Nuevo Módulo'}
                  </h2>
                </div>
                <button
                  onClick={handleCancelar}
                  className="w-10 h-10 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="titulo" className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Título del Módulo <span className="text-[#FE327B]">*</span>
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  placeholder="Ej: Prevención de la Violencia Sexual"
                  maxLength={200}
                  className={`w-full border-2 ${
                    errors.titulo ? 'border-[#FE327B]' : 'border-[#E2E8F0]'
                  } rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00B9F0] focus:border-[#00B9F0] transition-all`}
                />
                <div className="flex justify-between mt-2">
                  {errors.titulo ? (
                    <p className="text-[#FE327B] text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.titulo}
                    </p>
                  ) : (
                    <p className="text-[#718096] text-xs">Mínimo 3 caracteres</p>
                  )}
                  <p className="text-[#718096] text-xs">{formData.titulo.length}/200</p>
                </div>
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-semibold text-[#2D3748] mb-2">
                  Descripción del Módulo <span className="text-[#FE327B]">*</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el contenido y objetivos del módulo educativo..."
                  rows="5"
                  maxLength={1000}
                  className={`w-full border-2 ${
                    errors.descripcion ? 'border-[#FE327B]' : 'border-[#E2E8F0]'
                  } rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00B9F0] focus:border-[#00B9F0] resize-none transition-all`}
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
                  <p className="text-[#718096] text-xs">{formData.descripcion.length}/1000</p>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex gap-3">
              <button
                onClick={handleCancelar}
                disabled={procesando}
                className="flex-1 px-4 py-3 border-2 border-[#E2E8F0] rounded-xl font-semibold text-[#2D3748] hover:bg-[#F7FAFC] transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={procesando}
                className="flex-1 flex items-center justify-center gap-2 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white py-3 rounded-xl font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {procesando ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 text-white" />
                    {editando ? 'Actualizar' : 'Crear'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Carga Masiva */}
      {modalCargaMasiva && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-[#7AD107] text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Carga Masiva de Módulos</h2>
                </div>
                <button
                  onClick={handleCancelar}
                  className="w-10 h-10 hover:bg-white/20 rounded-lg transition-all flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Paso 1: Descargar plantilla */}
              <div className="p-5 bg-[#01C9F4]/5 rounded-xl border border-[#01C9F4]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#01C9F4] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-[#2D3748] text-lg">Paso 1: Descarga la plantilla</h4>
                </div>
                <p className="text-sm text-[#718096] mb-4">
                  Formato: <span className="font-mono bg-[#E2E8F0] px-2 py-1 rounded">titulo, descripcion, estado</span>
                </p>
                <p className="text-xs text-[#718096] mb-4">
                  El campo <strong>estado</strong> puede ser: <span className="font-mono bg-[#7AD107]/10 text-[#7AD107] px-2 py-0.5 rounded">activo</span> o <span className="font-mono bg-[#718096]/10 text-[#718096] px-2 py-0.5 rounded">inactivo</span>
                </p>
                <button
                  onClick={descargarPlantillaCSV}
                  className="w-full bg-[#01C9F4] hover:bg-[#00B9F0] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Download className="w-5 h-5 text-white" />
                  Descargar Plantilla CSV
                </button>
              </div>

              {/* Paso 2: Subir archivo */}
              <div>
                <label className="block text-sm font-semibold text-[#2D3748] mb-3">
                  Paso 2: Sube tu archivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full border-2 border-dashed border-[#E2E8F0] p-4 rounded-xl cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#7AD107] file:text-white hover:file:bg-[#7AD107]/90 transition-all hover:border-[#00B9F0]"
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
                  Todos los módulos se crearán asociados a este curso
                </p>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex gap-3">
              <button
                onClick={handleCancelar}
                className="flex-1 px-4 py-3 border-2 border-[#E2E8F0] rounded-xl font-semibold text-[#2D3748] hover:bg-[#F7FAFC] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={subirCSV}
                disabled={!file}
                className="flex-1 flex items-center justify-center gap-2 bg-[#7AD107] hover:bg-[#7AD107]/90 text-white py-3 rounded-xl font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5 text-white" />
                Procesar CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {modalConfirmacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header del Modal */}
            <div className={`p-6 rounded-t-2xl text-white ${
              modalConfirmacion.tipo === 'peligro' ? 'bg-[#FE327B]' : 
              modalConfirmacion.tipo === 'exito' ? 'bg-[#7AD107]' : 
              modalConfirmacion.tipo === 'error' ? 'bg-[#FE327B]' :
              'bg-[#FA6D00]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  {modalConfirmacion.tipo === 'peligro' ? (
                    <Trash2 className="w-6 h-6 text-white" />
                  ) : modalConfirmacion.tipo === 'exito' ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : modalConfirmacion.tipo === 'error' ? (
                    <AlertCircle className="w-6 h-6 text-white" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold">{modalConfirmacion.titulo}</h2>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              <p className="text-[#2D3748] text-base leading-relaxed whitespace-pre-line">
                {modalConfirmacion.mensaje}
              </p>
            </div>

            {/* Footer del Modal */}
            <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0]">
              {modalConfirmacion.cancelar ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalConfirmacion(null)}
                    className="flex-1 px-4 py-3 border-2 border-[#E2E8F0] rounded-xl font-semibold text-[#2D3748] hover:bg-[#F7FAFC] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={modalConfirmacion.accion}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all shadow-md ${
                      modalConfirmacion.tipo === 'peligro' 
                        ? 'bg-[#FE327B] hover:bg-[#FE327B]/90' 
                        : 'bg-[#00B9F0] hover:bg-[#01C9F4]'
                    }`}
                  >
                    Confirmar
                  </button>
                </div>
              ) : (
                <button
                  onClick={modalConfirmacion.accion || (() => setModalConfirmacion(null))}
                  className="w-full px-4 py-3 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-xl font-semibold transition-all shadow-md"
                >
                  Aceptar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModulosPage;