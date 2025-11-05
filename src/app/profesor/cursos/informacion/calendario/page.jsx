'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    Clock,
    MapPin,
    FileText,
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    Circle,
    Edit2,
    Trash2,
    Save,
    Users,
    School
} from 'lucide-react';

const API_BASE_URL = 'https://backend-edumon.onrender.com/api';

const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const categorias = [
    { value: 'escuela_padres', label: 'Escuela de Padres', icon: Users, color: 'blue' },
    { value: 'tarea', label: 'Tarea', icon: FileText, color: 'purple' },
    { value: 'institucional', label: 'Institucional', icon: School, color: 'cyan' }
];

const obtenerDiasDelMes = (mes, anio) => {
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const diasPrevios = primerDia.getDay();
    const diasMes = ultimoDia.getDate();
    const dias = [];

    const ultimoDiaMesAnterior = new Date(anio, mes, 0).getDate();
    for (let i = diasPrevios - 1; i >= 0; i--) {
        dias.push({
            dia: ultimoDiaMesAnterior - i,
            esMesActual: false,
            fecha: new Date(anio, mes - 1, ultimoDiaMesAnterior - i)
        });
    }

    for (let i = 1; i <= diasMes; i++) {
        dias.push({
            dia: i,
            esMesActual: true,
            fecha: new Date(anio, mes, i)
        });
    }

    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
        dias.push({
            dia: i,
            esMesActual: false,
            fecha: new Date(anio, mes + 1, i)
        });
    }

    return dias;
};

const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

const esHoy = (fecha) => {
    const hoy = new Date();
    const fechaComparar = new Date(fecha);
    return hoy.toDateString() === fechaComparar.toDateString();
};

const CalendarioCurso = () => {
    const [mesActual, setMesActual] = useState(new Date().getMonth());
    const [anioActual, setAnioActual] = useState(new Date().getFullYear());
    const [items, setItems] = useState([]);
    const [itemsAgrupados, setItemsAgrupados] = useState({});
    const [estadisticas, setEstadisticas] = useState({});
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [modalEvento, setModalEvento] = useState(null);
    const [modalCrear, setModalCrear] = useState(false);
    const [modalEditar, setModalEditar] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [vistaCompacta, setVistaCompacta] = useState(false);
    const [error, setError] = useState('');

    const [formEvento, setFormEvento] = useState({
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        hora: '',
        ubicacion: '',
        categoria: 'institucional'
    });

    useEffect(() => {
        cargarCalendario();
    }, [mesActual, anioActual]);

    const cargarCalendario = async () => {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams(window.location.search);
        const cursoId = params.get('cursoId') || '673bd050af9ce42dd8d94eba';

        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/calendario/${cursoId}?mes=${mesActual + 1}&anio=${anioActual}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setItems(data.items || []);
                setItemsAgrupados(data.itemsAgrupados || {});
                setEstadisticas(data.estadisticas || {});
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error al cargar el calendario');
        } finally {
            setLoading(false);
        }
    };
    const crearEvento = async () => {
    // Validaciones del frontend
    if (!formEvento.titulo || formEvento.titulo.length < 3) {
      setError('El título debe tener al menos 3 caracteres');
      return;
    }

    if (!formEvento.descripcion || formEvento.descripcion.length < 10) {
      setError('La descripción debe tener al menos 10 caracteres');
      return;
    }

    if (!formEvento.fechaInicio) {
      setError('La fecha de inicio es obligatoria');
      return;
    }

    if (!formEvento.fechaFin) {
      setError('La fecha de fin es obligatoria');
      return;
    }

    // Validar que las fechas sean hoy o futuras
    const fechaInicio = new Date(formEvento.fechaInicio);
    const fechaFin = new Date(formEvento.fechaFin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(0, 0, 0, 0);
    
    // Permitir fechas desde hoy
    if (fechaInicio < hoy) {
      setError('La fecha de inicio debe ser hoy o posterior');
      return;
    }

    // Para cumplir con backend: fechaFin debe ser > fechaInicio
    // Si el usuario selecciona el mismo día, agregamos 1 día automáticamente
    if (fechaFin.getTime() === fechaInicio.getTime()) {
      // Ajustar fechaFin a 1 día después para cumplir validación del backend
      const fechaFinAjustada = new Date(fechaFin);
      fechaFinAjustada.setDate(fechaFinAjustada.getDate() + 1);
      formEvento.fechaFin = fechaFinAjustada.toISOString().split('T')[0];
    } else if (fechaFin < fechaInicio) {
      setError('La fecha de fin debe ser igual o posterior a la fecha de inicio');
      return;
    }

    if (!formEvento.hora) {
      setError('La hora es obligatoria');
      return;
    }

    if (!formEvento.ubicacion || formEvento.ubicacion.length < 3) {
      setError('La ubicación debe tener al menos 3 caracteres');
      return;
    }

    const token = localStorage.getItem('token');
    const params = new URLSearchParams(window.location.search);
    const cursoId = params.get('cursoId') || '673bd050af9ce42dd8d94eba';

    try {
      setGuardando(true);
      setError('');

      const eventoData = {
        titulo: formEvento.titulo.trim(),
        descripcion: formEvento.descripcion.trim(),
        fechaInicio: formEvento.fechaInicio,
        fechaFin: formEvento.fechaFin,
        hora: formEvento.hora,
        ubicacion: formEvento.ubicacion.trim(),
        categoria: formEvento.categoria,
        cursosIds: [cursoId]
      };

      console.log('Enviando evento:', eventoData);

      const response = await fetch(`${API_BASE_URL}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(eventoData)
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Respuesta no JSON:', text);
        data = { message: 'Error del servidor: respuesta inválida' };
      }

      if (response.ok) {
        console.log('Evento creado:', data);
        setModalCrear(false);
        setFormEvento({
          titulo: '',
          descripcion: '',
          fechaInicio: '',
          fechaFin: '',
          hora: '',
          ubicacion: '',
          categoria: 'institucional'
        });
        await cargarCalendario();
      } else {
        console.error('Error del servidor:', data);
        console.error('Detalles de errores:', data.errors);
        
        // Manejar errores de validación
        if (data.errors && Array.isArray(data.errors)) {
          const errores = data.errors.map(e => `${e.path || e.param}: ${e.msg}`).join(' | ');
          setError(errores);
          console.log('Errores formateados:', errores);
        } else {
          setError(data.message || 'Error al crear el evento');
        }
      }
    } catch (error) {
      console.error('Error al crear evento:', error);
      setError('Error de conexión al crear el evento');
    } finally {
      setGuardando(false);
    }
  };
    const editarEvento = async () => {
        if (!formEvento.titulo || !formEvento.fechaInicio) {
            setError('El título y la fecha de inicio son obligatorios');
            return;
        }

        const token = localStorage.getItem('token');

        try {
            setGuardando(true);
            setError('');

            const eventoData = {
                titulo: formEvento.titulo,
                descripcion: formEvento.descripcion || '',
                fechaInicio: formEvento.fechaInicio,
                fechaFin: formEvento.fechaFin || formEvento.fechaInicio,
                hora: formEvento.hora || '00:00',
                ubicacion: formEvento.ubicacion || '',
                categoria: formEvento.categoria
            };

            console.log('Editando evento:', modalEditar.id, eventoData);

            const response = await fetch(`${API_BASE_URL}/eventos/${modalEditar.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(eventoData)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Evento actualizado:', data);
                setModalEditar(null);
                await cargarCalendario();
            } else {
                console.error('Error del servidor:', data);
                setError(data.message || 'Error al actualizar el evento');
            }
        } catch (error) {
            console.error('Error al editar evento:', error);
            setError('Error de conexión al editar el evento');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarEvento = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este evento?')) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_BASE_URL}/eventos/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                setModalEvento(null);
                await cargarCalendario();
            } else {
                const data = await response.json();
                setError(data.message || 'Error al eliminar el evento');
            }
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            setError('Error de conexión al eliminar el evento');
        }
    };

    const cambiarMes = (direccion) => {
        let nuevoMes = mesActual + direccion;
        let nuevoAnio = anioActual;

        if (nuevoMes > 11) {
            nuevoMes = 0;
            nuevoAnio++;
        } else if (nuevoMes < 0) {
            nuevoMes = 11;
            nuevoAnio--;
        }

        setMesActual(nuevoMes);
        setAnioActual(nuevoAnio);
    };

    const irHoy = () => {
        setMesActual(new Date().getMonth());
        setAnioActual(new Date().getFullYear());
    };

    const obtenerItemsDelDia = (fecha) => {
        const fechaStr = fecha.toISOString().split('T')[0];
        const itemsDia = itemsAgrupados[fechaStr] || [];
        if (filtroTipo === 'todos') return itemsDia;
        return itemsDia.filter(item => item.tipo === filtroTipo);
    };

    const abrirModalEditar = (item) => {
        setModalEvento(null);
        setModalEditar(item);
        setError('');

        const fechaInicio = new Date(item.fechaInicio);
        const fechaFin = item.fechaFin ? new Date(item.fechaFin) : fechaInicio;

        setFormEvento({
            titulo: item.titulo,
            descripcion: item.descripcion || '',
            fechaInicio: fechaInicio.toISOString().split('T')[0],
            fechaFin: fechaFin.toISOString().split('T')[0],
            hora: item.hora || '',
            ubicacion: item.ubicacion || '',
            categoria: item.categoria || 'institucional'
        });
    };

    const cerrarModal = () => {
        setModalCrear(false);
        setModalEditar(null);
        setError('');
        setFormEvento({
            titulo: '',
            descripcion: '',
            fechaInicio: '',
            fechaFin: '',
            hora: '',
            ubicacion: '',
            categoria: 'institucional'
        });
    };

    const diasDelMes = obtenerDiasDelMes(mesActual, anioActual);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">Cargando calendario...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.history.back()}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
                            >
                                <ArrowLeft size={20} className="text-gray-600" />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                                    <CalendarDays className="text-white" size={20} />
                                </div>
                                <h1 className="text-lg font-bold text-gray-900">Calendario del Curso</h1>
                            </div>
                        </div>
                        <button
                            onClick={() => setModalCrear(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 text-sm font-medium"
                        >
                            <Plus size={18} />
                            Nuevo Evento
                        </button>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Tareas', value: estadisticas.totalTareas || 0, color: 'from-purple-500 to-purple-600', icon: FileText },
                        { label: 'Eventos', value: estadisticas.totalEventos || 0, color: 'from-blue-500 to-blue-600', icon: CalendarDays },
                        { label: 'Vencidas', value: estadisticas.tareasVencidas || 0, color: 'from-red-500 to-red-600', icon: AlertCircle },
                        { label: 'Próximos', value: estadisticas.eventosProximos || 0, color: 'from-green-500 to-green-600', icon: Clock }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
                                </div>
                                <div className={`p-2 bg-gradient-to-r ${stat.color} rounded-lg`}>
                                    <stat.icon className="text-white" size={20} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendario */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    {/* Controles */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => cambiarMes(-1)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <h2 className="text-xl font-bold text-gray-900 min-w-[180px] text-center">
                                    {meses[mesActual]} {anioActual}
                                </h2>
                                <button
                                    onClick={() => cambiarMes(1)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={irHoy}
                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                                >
                                    Hoy
                                </button>
                                <button
                                    onClick={() => setVistaCompacta(!vistaCompacta)}
                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                                >
                                    {vistaCompacta ? 'Vista Normal' : 'Vista Compacta'}
                                </button>
                            </div>
                        </div>

                        {/* Filtros */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'todos', label: 'Todos' },
                                { value: 'tarea', label: 'Tareas' },
                                { value: 'evento', label: 'Eventos' }
                            ].map(filtro => (
                                <button
                                    key={filtro.value}
                                    onClick={() => setFiltroTipo(filtro.value)}
                                    className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 font-medium ${filtroTipo === filtro.value
                                            ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {filtro.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                        {diasSemana.map(dia => (
                            <div key={dia} className="p-2 text-center text-xs font-semibold text-gray-600">
                                {dia}
                            </div>
                        ))}
                    </div>

                    {/* Grid del calendario */}
                    <div className="grid grid-cols-7">
                        {diasDelMes.map((diaInfo, index) => {
                            const itemsDia = obtenerItemsDelDia(diaInfo.fecha);
                            const esHoyDia = esHoy(diaInfo.fecha);

                            return (
                                <div
                                    key={index}
                                    className={`${vistaCompacta ? 'min-h-[80px]' : 'min-h-[100px]'} p-2 border-r border-b border-gray-100 relative transition-all duration-200 ${!diaInfo.esMesActual ? 'bg-gray-50/50' : 'bg-white hover:bg-indigo-50/30'
                                        } ${esHoyDia ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/20' : ''}`}
                                >
                                    <div className="text-right mb-1">
                                        <span
                                            className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full transition-all duration-200 ${esHoyDia
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-md'
                                                    : diaInfo.esMesActual
                                                        ? 'text-gray-900 font-medium hover:bg-gray-100'
                                                        : 'text-gray-400'
                                                }`}
                                        >
                                            {diaInfo.dia}
                                        </span>
                                    </div>

                                    {itemsDia.length > 0 && (
                                        <div className="space-y-1">
                                            {itemsDia.slice(0, vistaCompacta ? 2 : 3).map((item, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setModalEvento(item)}
                                                    className="w-full text-left group"
                                                >
                                                    <div className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-all duration-200 ${item.tipo === 'tarea'
                                                            ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 hover:shadow-sm'
                                                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 hover:shadow-sm'
                                                        }`}>
                                                        <Circle size={4} fill="currentColor" className="flex-shrink-0" />
                                                        <span className="truncate font-medium text-[10px]">{item.titulo}</span>
                                                    </div>
                                                </button>
                                            ))}
                                            {itemsDia.length > (vistaCompacta ? 2 : 3) && (
                                                <div className="text-[10px] text-gray-500 text-center pt-0.5 font-medium">
                                                    +{itemsDia.length - (vistaCompacta ? 2 : 3)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Modal de detalles */}
            {modalEvento && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className={`p-6 rounded-t-2xl ${modalEvento.tipo === 'tarea'
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600'
                            }`}>
                            <div className="flex items-start justify-between text-white">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {modalEvento.tipo === 'tarea' ? (
                                            <FileText size={20} />
                                        ) : (
                                            <CalendarDays size={20} />
                                        )}
                                        <span className="text-sm font-medium opacity-90">
                                            {modalEvento.tipo === 'tarea' ? 'Tarea' : 'Evento'}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold">{modalEvento.titulo}</h2>
                                </div>
                                <button
                                    onClick={() => setModalEvento(null)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {modalEvento.descripcion && (
                                <p className="text-gray-700 text-sm leading-relaxed">{modalEvento.descripcion}</p>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock className="text-gray-400" size={16} />
                                    <div>
                                        <div className="text-gray-700 font-medium">{formatearFecha(modalEvento.fecha)}</div>
                                        {modalEvento.hora && (
                                            <div className="text-gray-500 text-xs">{modalEvento.hora}</div>
                                        )}
                                    </div>
                                </div>

                                {modalEvento.modulo && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <FileText className="text-gray-400" size={16} />
                                        <span className="text-gray-700">{modalEvento.modulo}</span>
                                    </div>
                                )}

                                {modalEvento.ubicacion && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="text-gray-400" size={16} />
                                        <span className="text-gray-700">{modalEvento.ubicacion}</span>
                                    </div>
                                )}

                                {modalEvento.estado && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <AlertCircle className="text-gray-400" size={16} />
                                        <span className="text-gray-700 capitalize">{modalEvento.estado}</span>
                                    </div>
                                )}
                            </div>

                            {modalEvento.tipo === 'evento' && (
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => abrirModalEditar(modalEvento)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        <Edit2 size={16} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => eliminarEvento(modalEvento.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        <Trash2 size={16} />
                                        Eliminar
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setModalEvento(null)}
                                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal crear/editar evento */}
            {(modalCrear || modalEditar) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalEditar ? 'Editar Evento' : 'Nuevo Evento'}
                                </h2>
                                <button
                                    onClick={cerrarModal}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formEvento.titulo}
                                    onChange={(e) => setFormEvento({ ...formEvento, titulo: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                    placeholder="Título del evento"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={formEvento.descripcion}
                                    onChange={(e) => setFormEvento({ ...formEvento, descripcion: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                                    rows="3"
                                    placeholder="Descripción del evento"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha Inicio <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formEvento.fechaInicio}
                                        onChange={(e) => setFormEvento({ ...formEvento, fechaInicio: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                                    <input
                                        type="date"
                                        value={formEvento.fechaFin}
                                        onChange={(e) => setFormEvento({ ...formEvento, fechaFin: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                                    <input
                                        type="time"
                                        value={formEvento.hora}
                                        onChange={(e) => setFormEvento({ ...formEvento, hora: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select
                                        value={formEvento.categoria}
                                        onChange={(e) => setFormEvento({ ...formEvento, categoria: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                    >
                                        {categorias.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                                <input
                                    type="text"
                                    value={formEvento.ubicacion}
                                    onChange={(e) => setFormEvento({ ...formEvento, ubicacion: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                    placeholder="Ubicación del evento"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={cerrarModal}
                                    disabled={guardando}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={modalEditar ? editarEvento : crearEvento}
                                    disabled={guardando || !formEvento.titulo || !formEvento.fechaInicio}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white rounded-lg font-medium transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {guardando ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {modalEditar ? 'Guardar Cambios' : 'Crear Evento'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarioCurso;