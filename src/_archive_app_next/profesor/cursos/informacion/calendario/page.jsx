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
    School,
    Loader2,
    CheckCircle2,
    Home,
    BookOpen,
    ClipboardList
} from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';

const API_BASE_URL = 'https://backend-edumon.onrender.com/api';

const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const categorias = [
    { value: 'escuela_padres', label: 'Escuela de Padres', icon: Users, color: '#FE327B' },
    { value: 'tarea', label: 'Tarea', icon: FileText, color: '#7AD107' },
    { value: 'institucional', label: 'Institucional', icon: School, color: '#00B9F0' }
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
    const [exitoMensaje, setExitoMensaje] = useState('');

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
            mostrarError('Error al cargar el calendario');
        } finally {
            setLoading(false);
        }
    };

    const mostrarError = (mensaje) => {
        setError(mensaje);
        setTimeout(() => setError(''), 5000);
    };

    const mostrarExito = (mensaje) => {
        setExitoMensaje(mensaje);
        setTimeout(() => setExitoMensaje(''), 3000);
    };

    const crearEvento = async () => {
        if (!formEvento.titulo || formEvento.titulo.length < 3) {
            mostrarError('El título debe tener al menos 3 caracteres');
            return;
        }

        if (!formEvento.descripcion || formEvento.descripcion.length < 10) {
            mostrarError('La descripción debe tener al menos 10 caracteres');
            return;
        }

        if (!formEvento.fechaInicio || !formEvento.fechaFin) {
            mostrarError('Las fechas de inicio y fin son obligatorias');
            return;
        }

        const fechaInicio = new Date(formEvento.fechaInicio);
        const fechaFin = new Date(formEvento.fechaFin);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin.setHours(0, 0, 0, 0);

        if (fechaInicio < hoy) {
            mostrarError('La fecha de inicio debe ser hoy o posterior');
            return;
        }

        if (fechaFin.getTime() === fechaInicio.getTime()) {
            const fechaFinAjustada = new Date(fechaFin);
            fechaFinAjustada.setDate(fechaFinAjustada.getDate() + 1);
            formEvento.fechaFin = fechaFinAjustada.toISOString().split('T')[0];
        } else if (fechaFin < fechaInicio) {
            mostrarError('La fecha de fin debe ser igual o posterior a la fecha de inicio');
            return;
        }

        if (!formEvento.hora) {
            mostrarError('La hora es obligatoria');
            return;
        }

        if (!formEvento.ubicacion || formEvento.ubicacion.length < 3) {
            mostrarError('La ubicación debe tener al menos 3 caracteres');
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
                mostrarExito('Evento creado exitosamente');
                await cargarCalendario();
            } else {
                if (data.errors && Array.isArray(data.errors)) {
                    const errores = data.errors.map(e => `${e.path || e.param}: ${e.msg}`).join(' | ');
                    mostrarError(errores);
                } else {
                    mostrarError(data.message || 'Error al crear el evento');
                }
            }
        } catch (error) {
            console.error('Error al crear evento:', error);
            mostrarError('Error de conexión al crear el evento');
        } finally {
            setGuardando(false);
        }
    };

    const editarEvento = async () => {
        if (!formEvento.titulo || !formEvento.fechaInicio) {
            mostrarError('El título y la fecha de inicio son obligatorios');
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
                setModalEditar(null);
                mostrarExito('Evento actualizado exitosamente');
                await cargarCalendario();
            } else {
                mostrarError(data.message || 'Error al actualizar el evento');
            }
        } catch (error) {
            console.error('Error al editar evento:', error);
            mostrarError('Error de conexión al editar el evento');
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
                mostrarExito('Evento eliminado exitosamente');
                await cargarCalendario();
            } else {
                const data = await response.json();
                mostrarError(data.message || 'Error al eliminar el evento');
            }
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            mostrarError('Error de conexión al eliminar el evento');
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

    const navegarA = (ruta) => {
        const params = new URLSearchParams(window.location.search);
        const cursoId = params.get('cursoId');
        window.location.href = `${ruta}?cursoId=${cursoId}`;
    };

    const diasDelMes = obtenerDiasDelMes(mesActual, anioActual);

    if (loading) {
        return <LoadingScreen mensaje="Cargando calendario del curso..." />;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Notificaciones flotantes */}
            {error && (
                <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
                    <div className="bg-white border-l-4 border-[#FA6D00] rounded-lg shadow-lg p-4 flex items-start gap-3">
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
                    <div className="bg-white border-l-4 border-[#7AD107] rounded-lg shadow-lg p-4 flex items-start gap-3">
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
            <div className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.history.back()}
                                className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center text-white hover:bg-[#01C9F4] transition-all"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="h-8 w-px bg-[#E2E8F0]"></div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#00B9F0] flex items-center justify-center">
                                    <CalendarDays className="text-white" size={20} />
                                </div>
                                <h1 className="text-xl font-bold text-[#2D3748]">Calendario del Curso</h1>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => navegarA('/profesor')}
                                className="w-10 h-10 bg-[#E2E8F0] hover:bg-[#718096] rounded-lg transition-all flex items-center justify-center group"
                                title="Inicio"
                            >
                                <Home size={18} className="text-[#718096] group-hover:text-white" />
                            </button>
                            <button
                                onClick={() => navegarA('/profesor/cursos/informacion')}
                                className="w-10 h-10 bg-[#FE327B] hover:bg-[#FE327B]/90 rounded-lg transition-all flex items-center justify-center"
                                title="Info del Curso"
                            >
                                <FileText size={18} className="text-white" />
                            </button>
                            <button
                                onClick={() => navegarA('/profesor/cursos/crear/modulos')}
                                className="w-10 h-10 bg-[#7AD107] hover:bg-[#7AD107]/90 rounded-lg transition-all flex items-center justify-center"
                                title="Módulos"
                            >
                                <BookOpen size={18} className="text-white" />
                            </button>
                            <button
                                onClick={() => navegarA('/profesor/cursos/crear/modulos/tareas')}
                                className="w-10 h-10 bg-[#FA6D00] hover:bg-[#FA6D00]/90 rounded-lg transition-all flex items-center justify-center"
                                title="Tareas"
                            >
                                <ClipboardList size={18} className="text-white" />
                            </button>
                            <button
                                onClick={() => setModalCrear(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#00B9F0] text-white rounded-lg hover:bg-[#01C9F4] transition-all shadow-md hover:shadow-lg font-medium"
                            >
                                <Plus size={18} className="text-white" />
                                <span className="hidden sm:inline">Nuevo Evento</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Tareas', value: estadisticas.totalTareas || 0, color: '#7AD107', icon: FileText },
                        { label: 'Eventos', value: estadisticas.totalEventos || 0, color: '#00B9F0', icon: CalendarDays },
                        { label: 'Vencidas', value: estadisticas.tareasVencidas || 0, color: '#FA6D00', icon: AlertCircle },
                        { label: 'Próximos', value: estadisticas.eventosProximos || 0, color: '#7AD107', icon: Clock }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl p-5 shadow-md border border-[#E2E8F0] hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-3xl font-bold text-[#2D3748]">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-[#718096] mt-1 font-medium">{stat.label}</div>
                                </div>
                                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: stat.color }}>
                                    <stat.icon className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendario */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden">
                    {/* Controles */}
                    <div className="p-6 border-b border-[#E2E8F0]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => cambiarMes(-1)}
                                    className="w-10 h-10 bg-[#00B9F0] hover:bg-[#01C9F4] rounded-lg transition-all flex items-center justify-center"
                                >
                                    <ChevronLeft size={20} className="text-white" />
                                </button>
                                <h2 className="text-2xl font-bold text-[#2D3748] min-w-[200px] text-center">
                                    {meses[mesActual]} {anioActual}
                                </h2>
                                <button
                                    onClick={() => cambiarMes(1)}
                                    className="w-10 h-10 bg-[#00B9F0] hover:bg-[#01C9F4] rounded-lg transition-all flex items-center justify-center"
                                >
                                    <ChevronRight size={20} className="text-white" />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={irHoy}
                                    className="px-4 py-2 text-sm bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg transition-all font-medium"
                                >
                                    Hoy
                                </button>
                                <button
                                    onClick={() => setVistaCompacta(!vistaCompacta)}
                                    className="px-4 py-2 text-sm bg-[#E2E8F0] hover:bg-[#718096] hover:text-white text-[#2D3748] rounded-lg transition-all font-medium"
                                >
                                    {vistaCompacta ? 'Normal' : 'Compacta'}
                                </button>
                            </div>
                        </div>

                        {/* Filtros */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'todos', label: 'Todos', color: '#718096' },
                                { value: 'tarea', label: 'Tareas', color: '#7AD107' },
                                { value: 'evento', label: 'Eventos', color: '#00B9F0' }
                            ].map(filtro => (
                                <button
                                    key={filtro.value}
                                    onClick={() => setFiltroTipo(filtro.value)}
                                    className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${filtroTipo === filtro.value
                                            ? 'text-white shadow-md'
                                            : 'bg-[#F7FAFC] text-[#718096] hover:bg-[#E2E8F0]'
                                        }`}
                                    style={filtroTipo === filtro.value ? { backgroundColor: filtro.color } : {}}
                                >
                                    {filtro.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 bg-[#F7FAFC] border-b border-[#E2E8F0]">
                        {diasSemana.map(dia => (
                            <div key={dia} className="p-3 text-center text-sm font-bold text-[#2D3748]">
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
                                    className={`${vistaCompacta ? 'min-h-[90px]' : 'min-h-[120px]'} p-3 border-r border-b border-[#E2E8F0] relative transition-all ${!diaInfo.esMesActual ? 'bg-[#F7FAFC]' : 'bg-white hover:bg-[#F7FAFC]'
                                        } ${esHoyDia ? 'ring-2 ring-inset ring-[#00B9F0] bg-[#E6F9FF]' : ''}`}
                                >
                                    <div className="text-right mb-2">
                                        <span
                                            className={`inline-flex items-center justify-center w-8 h-8 text-sm rounded-full transition-all font-bold ${esHoyDia
                                                    ? 'bg-[#00B9F0] text-white shadow-md'
                                                    : diaInfo.esMesActual
                                                        ? 'text-[#2D3748] hover:bg-[#E2E8F0]'
                                                        : 'text-[#718096]'
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
                                                    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all font-medium ${item.tipo === 'tarea'
                                                            ? 'bg-[#7AD107]/10 hover:bg-[#7AD107]/20 text-[#7AD107] border border-[#7AD107]/20'
                                                            : 'bg-[#00B9F0]/10 hover:bg-[#00B9F0]/20 text-[#00B9F0] border border-[#00B9F0]/20'
                                                        }`}>
                                                        <Circle size={6} fill="currentColor" className="flex-shrink-0" />
                                                        <span className="truncate font-medium">{item.titulo}</span>
                                                    </div>
                                                </button>
                                            ))}
                                            {itemsDia.length > (vistaCompacta ? 2 : 3) && (
                                                <div className="text-xs text-[#718096] text-center pt-1 font-bold">
                                                    +{itemsDia.length - (vistaCompacta ? 2 : 3)} más
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
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className={`p-6 rounded-t-2xl ${modalEvento.tipo === 'tarea' ? 'bg-[#7AD107]' : 'bg-[#00B9F0]'}`}>
                            <div className="flex items-start justify-between text-white">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                            {modalEvento.tipo === 'tarea' ? (
                                                <FileText size={18} className="text-white" />
                                            ) : (
                                                <CalendarDays size={18} className="text-white" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium">
                                            {modalEvento.tipo === 'tarea' ? 'Tarea' : 'Evento'}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold">{modalEvento.titulo}</h2>
                                </div>
                                <button
                                    onClick={() => setModalEvento(null)}
                                    className="w-8 h-8 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <X size={20} className="text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {modalEvento.descripcion && (
                                <p className="text-[#2D3748] text-sm leading-relaxed">{modalEvento.descripcion}</p>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm bg-[#F7FAFC] p-3 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-[#00B9F0] flex items-center justify-center">
                                        <Clock className="text-white" size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[#2D3748] font-semibold">{formatearFecha(modalEvento.fecha)}</div>
                                        {modalEvento.hora && (
                                            <div className="text-[#718096] text-xs">{modalEvento.hora}</div>
                                        )}
                                    </div>
                                </div>

                                {modalEvento.modulo && (
                                    <div className="flex items-center gap-3 text-sm bg-[#F7FAFC] p-3 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-[#FE327B] flex items-center justify-center">
                                            <FileText className="text-white" size={16} />
                                        </div>
                                        <span className="text-[#2D3748] font-medium">{modalEvento.modulo}</span>
                                    </div>
                                )}

                                {modalEvento.ubicacion && (
                                    <div className="flex items-center gap-3 text-sm bg-[#F7FAFC] p-3 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-[#7AD107] flex items-center justify-center">
                                            <MapPin className="text-white" size={16} />
                                        </div>
                                        <span className="text-[#2D3748] font-medium">{modalEvento.ubicacion}</span>
                                    </div>
                                )}

                                {modalEvento.estado && (
                                    <div className="flex items-center gap-3 text-sm bg-[#F7FAFC] p-3 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-[#FA6D00] flex items-center justify-center">
                                            <AlertCircle className="text-white" size={16} />
                                        </div>
                                        <span className="text-[#2D3748] font-medium capitalize">{modalEvento.estado}</span>
                                    </div>
                                )}
                            </div>

                            {modalEvento.tipo === 'evento' && (
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => abrirModalEditar(modalEvento)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg font-medium transition-all text-sm"
                                    >
                                        <Edit2 size={16} className="text-white" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => eliminarEvento(modalEvento.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#FA6D00] hover:bg-[#FA6D00]/90 text-white rounded-lg font-medium transition-all text-sm"
                                    >
                                        <Trash2 size={16} className="text-white" />
                                        Eliminar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0]">
                            <button
                                onClick={() => setModalEvento(null)}
                                className="w-full px-4 py-3 bg-[#E2E8F0] hover:bg-[#718096] hover:text-white text-[#2D3748] rounded-lg font-medium transition-all text-sm"
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
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="p-6 border-b border-[#E2E8F0] bg-[#00B9F0]">
                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        <CalendarDays size={20} className="text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold">
                                        {modalEditar ? 'Editar Evento' : 'Nuevo Evento'}
                                    </h2>
                                </div>
                                <button
                                    onClick={cerrarModal}
                                    className="w-8 h-8 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <X size={20} className="text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-[#FA6D00]/10 border border-[#FA6D00]/20 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={18} className="text-[#FA6D00] flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-[#FA6D00] font-medium">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                                    Título <span className="text-[#FA6D00]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formEvento.titulo}
                                    onChange={(e) => setFormEvento({ ...formEvento, titulo: e.target.value })}
                                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-sm font-medium text-[#2D3748]"
                                    placeholder="Título del evento"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                                    Descripción <span className="text-[#FA6D00]">*</span>
                                </label>
                                <textarea
                                    value={formEvento.descripcion}
                                    onChange={(e) => setFormEvento({ ...formEvento, descripcion: e.target.value })}
                                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-sm resize-none font-medium text-[#2D3748]"
                                    rows="3"
                                    placeholder="Descripción del evento"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                                        Fecha Inicio <span className="text-[#FA6D00]">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formEvento.fechaInicio}
                                        onChange={(e) => setFormEvento({ ...formEvento, fechaInicio: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-sm font-medium text-[#2D3748]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                                        Fecha Fin <span className="text-[#FA6D00]">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formEvento.fechaFin}
                                        onChange={(e) => setFormEvento({ ...formEvento, fechaFin: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-sm font-medium text-[#2D3748]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                                        Hora <span className="text-[#FA6D00]">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={formEvento.hora}
                                        onChange={(e) => setFormEvento({ ...formEvento, hora: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-sm font-medium text-[#2D3748]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D3748] mb-2">Categoría</label>
                                    <select
                                        value={formEvento.categoria}
                                        onChange={(e) => setFormEvento({ ...formEvento, categoria: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-sm font-medium text-[#2D3748]"
                                    >
                                        {categorias.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#2D3748] mb-2">
                                    Ubicación <span className="text-[#FA6D00]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formEvento.ubicacion}
                                    onChange={(e) => setFormEvento({ ...formEvento, ubicacion: e.target.value })}
                                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#00B9F0] focus:border-transparent text-sm font-medium text-[#2D3748]"
                                    placeholder="Ubicación del evento"
                                />
                            </div>
                        </div>

                        <div className="bg-[#F7FAFC] p-4 rounded-b-2xl border-t border-[#E2E8F0] flex gap-3">
                            <button
                                onClick={cerrarModal}
                                disabled={guardando}
                                className="flex-1 px-4 py-3 bg-[#E2E8F0] hover:bg-[#718096] hover:text-white text-[#2D3748] rounded-lg font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={modalEditar ? editarEvento : crearEvento}
                                disabled={guardando || !formEvento.titulo || !formEvento.fechaInicio}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#00B9F0] hover:bg-[#01C9F4] text-white rounded-lg font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {guardando ? (
                                    <>
                                        <Loader2 className="animate-spin text-white" size={18} />
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} className="text-white" />
                                        <span>{modalEditar ? 'Actualizar' : 'Crear Evento'}</span>
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

export default CalendarioCurso;