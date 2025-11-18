'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChatBubbleBottomCenterTextIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  HeartIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  AcademicCapIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import '@/app/globals.css';

const EdumonLanding = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => router.push('/auth/login');

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const features = [
    {
      icon: <UserGroupIcon className="w-10 h-10 text-white" />,
      title: "Para Docentes",
      description: "Crea grados, registra familias, sube tareas y comunica información de forma rápida y organizada.",
      color: "bg-gradient-to-br from-[#00B9F0] to-[#01C9F4]"
    },
    {
      icon: <HeartIcon className="w-10 h-10 text-white" />,
      title: "Para Padres",
      description: "Recibe tareas, materiales de apoyo y recordatorios directamente en tu celular.",
      color: "bg-gradient-to-br from-[#7AD107] to-[#9DE831]"
    },
    {
      icon: <CalendarDaysIcon className="w-10 h-10 text-white" />,
      title: "Calendario de Actividades",
      description: "Consulta las próximas reuniones y escuelas de padres en tiempo real.",
      color: "bg-gradient-to-br from-[#FE327B] to-[#FF5A9D]"
    },
    {
      icon: <DevicePhoneMobileIcon className="w-10 h-10 text-white" />,
      title: "App Móvil",
      description: "Accede desde cualquier lugar con nuestra aplicación móvil intuitiva.",
      color: "bg-gradient-to-br from-[#FA6D00] to-[#FFA559]"
    },
    {
      icon: <SparklesIcon className="w-10 h-10 text-white" />,
      title: "Notificaciones Inteligentes",
      description: "Recibe alertas personalizadas sobre actividades y tareas importantes.",
      color: "bg-gradient-to-br from-[#FED31F] to-[#FFE066]"
    },
    {
      icon: <ShieldCheckIcon className="w-10 h-10 text-white" />,
      title: "Seguridad Total",
      description: "Tus datos y los de tu familia protegidos con los más altos estándares.",
      color: "bg-gradient-to-br from-[#00B9F0] to-[#7AD107]"
    }
  ];

  const benefits = [
    {
      icon: <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-white" />,
      title: "Comunicación directa",
      description: "Conexión constante entre docentes, padres y coordinadores sin intermediarios.",
      color: "bg-[#00B9F0]"
    },
    {
      icon: <ClipboardDocumentCheckIcon className="w-8 h-8 text-white" />,
      title: "Entrega de tareas optimizada",
      description: "Evita revisar cientos de cuadernos físicos, todo se gestiona desde la plataforma.",
      color: "bg-[#7AD107]"
    },
    {
      icon: <BookOpenIcon className="w-8 h-8 text-white" />,
      title: "Plataforma educativa moderna",
      description: "Diseñada para fortalecer la escuela de padres con tecnología sencilla y útil.",
      color: "bg-[#FE327B]"
    },
    {
      icon: <AcademicCapIcon className="w-8 h-8 text-white" />,
      title: "Seguimiento personalizado",
      description: "Monitorea el progreso de cada familia y adapta las actividades según sus necesidades.",
      color: "bg-[#FA6D00]"
    }
  ];

  const team = [
    {
      name: "Karen Veronica Mancilla",
      role: "Desarrolladora Frontend",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karen&backgroundColor=00B9F0"
    },
    {
      name: "Bryan Davis Yepes",
      role: "Desarrollador Backend",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bryan&backgroundColor=7AD107"
    }
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Madre de familia",
      comment: "Edumon ha facilitado enormemente la comunicación con los docentes. Ahora sé exactamente qué actividades debe realizar mi hijo.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria&backgroundColor=FE327B"
    },
    {
      name: "Carlos Ramírez",
      role: "Padre de familia",
      comment: "La app es muy intuitiva. Recibo todas las notificaciones a tiempo y puedo subir las evidencias desde mi celular.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos&backgroundColor=00B9F0"
    },
    {
      name: "Andrea López",
      role: "Madre de familia",
      comment: "Me encanta poder ver el calendario de actividades y no perderme ninguna escuela de padres. ¡Excelente herramienta!",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andrea&backgroundColor=7AD107"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#2D3748] relative overflow-hidden">
      {/* Burbujas decorativas animadas */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
        <div className="bubble bubble-4"></div>
        <div className="bubble bubble-5"></div>
        <div className="bubble bubble-6"></div>
        <div className="bubble bubble-7"></div>
        <div className="bubble bubble-8"></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg' : 'bg-white/80 backdrop-blur-md'}`}>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => scrollToSection('inicio')}>
            <img src="/img/letras.png" alt="Edumon" className="w-32 sm:w-40 md:w-50 h-auto" />
          </div>

          {/* Nav (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8">
            {['inicio', 'que-es', 'caracteristicas', 'equipo', 'testimonios', 'contacto'].map((sec, i) => (
              <button
                key={i}
                onClick={() => scrollToSection(sec)}
                className="text-[#2D3748] hover:text-[#00B9F0] font-semibold transition-all hover:scale-110 relative group"
              >
                {sec === 'inicio' ? 'Inicio' : 
                 sec === 'que-es' ? '¿Qué es?' : 
                 sec === 'caracteristicas' ? 'Características' : 
                 sec === 'equipo' ? 'Equipo' :
                 sec === 'testimonios' ? 'Testimonios' :
                 'Contacto'}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#00B9F0] group-hover:w-full transition-all duration-300"></span>
              </button>
            ))}
          </nav>

          {/* Button */}
          <div className="hidden lg:flex items-center gap-3">
            <button 
              onClick={handleLogin} 
              className="px-6 py-3 bg-gradient-to-r from-[#00B9F0] to-[#01C9F4] text-white font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Iniciar Sesión
            </button>
          </div>

          {/* Mobile Menu Icon */}
          <button className="lg:hidden p-2 hover:bg-[#00B9F0]/10 rounded-full transition-all" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <XMarkIcon className="w-6 h-6 text-[#00B9F0]" /> : <Bars3Icon className="w-6 h-6 text-[#00B9F0]" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-lg shadow-2xl mx-3 mb-3 rounded-3xl p-6 space-y-4 animate-fadeIn border border-[#00B9F0]/20">
            {['inicio', 'que-es', 'caracteristicas', 'equipo', 'testimonios', 'contacto'].map((sec, i) => (
              <button
                key={i}
                onClick={() => scrollToSection(sec)}
                className="block text-left w-full text-[#2D3748] hover:text-[#00B9F0] hover:bg-[#00B9F0]/5 font-semibold py-3 px-4 rounded-xl transition-all"
              >
                {sec === 'inicio' ? 'Inicio' : 
                 sec === 'que-es' ? '¿Qué es?' : 
                 sec === 'caracteristicas' ? 'Características' : 
                 sec === 'equipo' ? 'Equipo' :
                 sec === 'testimonios' ? 'Testimonios' :
                 'Contacto'}
              </button>
            ))}
            <div className="pt-4 border-t border-[#00B9F0]/20">
              <button 
                onClick={handleLogin} 
                className="w-full px-6 py-4 bg-gradient-to-r from-[#00B9F0] to-[#01C9F4] text-white font-bold rounded-full hover:shadow-xl transition-all"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="inicio" className="relative min-h-screen flex flex-col justify-center items-center px-4 pt-32 pb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 z-10">
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-[#00B9F0]/10 to-[#01C9F4]/10 rounded-full border border-[#00B9F0]/20">
                <span className="text-[#00B9F0] font-semibold text-sm">✨ Próximamente en Play Store</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                Fortaleciendo la 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B9F0] to-[#01C9F4]"> escuela de padres </span>
                en Colombia
              </h1>
              
              <p className="text-lg sm:text-xl text-[#718096] leading-relaxed">
                La plataforma digital que transforma la comunicación entre instituciones educativas y familias, 
                ayudando a los padres a ser mejores mediante una escuela de padres moderna y efectiva.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleLogin} 
                  className="group px-8 py-4 bg-gradient-to-r from-[#00B9F0] to-[#01C9F4] text-white font-bold rounded-full hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Iniciar Sesión</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button 
                  onClick={() => scrollToSection('que-es')}
                  className="px-8 py-4 border-2 border-[#00B9F0] text-[#00B9F0] font-bold rounded-full hover:bg-[#00B9F0]/5 transform hover:scale-105 transition-all duration-300"
                >
                  Conocer más
                </button>
              </div>

              <div className="flex flex-wrap gap-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#2D3748]">500+</p>
                    <p className="text-sm text-[#718096]">Familias activas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7AD107] to-[#9DE831] flex items-center justify-center">
                    <AcademicCapIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#2D3748]">50+</p>
                    <p className="text-sm text-[#718096]">Instituciones</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00B9F0]/20 to-[#7AD107]/20 rounded-full blur-3xl"></div>
                <img 
                  src="img/fondo.png" 
                  alt="Edumon Mascota" 
                  className="relative w-64 sm:w-80 lg:w-96 h-auto animate-float drop-shadow-2xl" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Qué es Edumon - Ampliada */}
      <section id="que-es" className="relative py-24 px-4 bg-gradient-to-br from-[#F7FAFC] to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              ¿Qué es <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B9F0] to-[#01C9F4]">Edumon</span>?
            </h2>
            <p className="text-xl text-[#718096] max-w-3xl mx-auto">
              Una plataforma revolucionaria diseñada para las instituciones educativas colombianas
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center flex-shrink-0">
                    <BookOpenIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-[#2D3748]">Escuela de Padres Digital</h3>
                    <p className="text-[#718096] leading-relaxed">
                      Fortalecemos la escuela de padres en instituciones educativas colombianas, 
                      proporcionando herramientas modernas para que los padres desarrollen mejores 
                      habilidades de crianza y acompañamiento académico.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7AD107] to-[#9DE831] flex items-center justify-center flex-shrink-0">
                    <UserGroupIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-[#2D3748]">Gestión Integral</h3>
                    <p className="text-[#718096] leading-relaxed">
                      Los docentes pueden crear y gestionar grados, registrar familias completas, 
                      asignar tareas con materiales de apoyo, y mantener una comunicación fluida 
                      con todos los participantes del proceso educativo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FE327B] to-[#FF5A9D] flex items-center justify-center flex-shrink-0">
                    <DevicePhoneMobileIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-[#2D3748]">Acceso Móvil</h3>
                    <p className="text-[#718096] leading-relaxed">
                      Los padres reciben notificaciones instantáneas, acceden a materiales educativos, 
                      consultan el calendario de actividades y pueden enviar evidencias de cumplimiento 
                      directamente desde sus dispositivos móviles.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-[#00B9F0]/10 to-[#7AD107]/10 rounded-3xl p-8">
                <img 
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=800&fit=crop" 
                  alt="Familia usando Edumon" 
                  className="rounded-2xl shadow-2xl w-full h-auto object-cover"
                />
                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-2xl max-w-xs">
                  <p className="text-sm text-[#718096] mb-2">Impacto real</p>
                  <p className="text-3xl font-bold text-[#00B9F0]">95%</p>
                  <p className="text-sm text-[#2D3748] font-semibold">de satisfacción de usuarios</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all">
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00B9F0] to-[#01C9F4]">100%</p>
              <p className="text-sm text-[#718096] mt-2">Comunicación efectiva</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all">
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#7AD107] to-[#9DE831]">80%</p>
              <p className="text-sm text-[#718096] mt-2">Menos tiempo en gestión</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all">
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FE327B] to-[#FF5A9D]">24/7</p>
              <p className="text-sm text-[#718096] mt-2">Disponibilidad</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all">
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FA6D00] to-[#FFA559]">∞</p>
              <p className="text-sm text-[#718096] mt-2">Posibilidades</p>
            </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="relative py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Características principales</h2>
            <p className="text-xl text-[#718096] max-w-3xl mx-auto">
              Una herramienta completa pensada para docentes, padres y coordinadores
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#00B9F0]/30 hover:-translate-y-2"
              >
                <div className={`${f.color} p-8 flex justify-center items-center h-32`}>
                  <div className="transform group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-[#2D3748]">{f.title}</h3>
                  <p className="text-[#718096] leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="relative py-24 bg-gradient-to-br from-[#F7FAFC] to-white px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Beneficios de usar <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B9F0] to-[#7AD107]">Edumon</span>
            </h2>
            <p className="text-xl text-[#718096] max-w-3xl mx-auto">
              Transforma la manera en que tu institución se comunica con las familias
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <div 
                key={i} 
                className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 hover:-translate-y-2"
              >
                <div className={`${b.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                  {b.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#2D3748]">{b.title}</h3>
                <p className="text-[#718096] leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section id="equipo" className="relative py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Nuestro Equipo</h2>
            <p className="text-xl text-[#718096] max-w-3xl mx-auto">
              Desarrolladores apasionados trabajando para mejorar la educación en Colombia
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {team.map((member, i) => (
              <div 
                key={i}
                className="group bg-gradient-to-br from-white to-[#F7FAFC] rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-[#00B9F0]/20 hover:-translate-y-2"
              >
                <div className="bg-gradient-to-br from-[#00B9F0]/10 to-[#7AD107]/10 p-8 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00B9F0] to-[#7AD107] rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <img 
                      src={member.avatar}
                      alt={member.name}
                      className="relative w-32 h-32 rounded-full border-4 border-white shadow-2xl group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                <div className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-[#2D3748] mb-2">{member.name}</h3>
                  <p className="text-[#00B9F0] font-semibold mb-4">{member.role}</p>
                  <div className="flex justify-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <span className="text-white text-sm font-bold">in</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7AD107] to-[#9DE831] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <span className="text-white text-sm font-bold">@</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section id="testimonios" className="relative py-24 px-4 bg-gradient-to-br from-[#F7FAFC] to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Familias que ya usan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B9F0] to-[#7AD107]">Edumon</span>
            </h2>
            <p className="text-xl text-[#718096] max-w-3xl mx-auto">
              Historias reales de padres y madres que han mejorado su conexión con la escuela
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div 
                key={i}
                className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 hover:-translate-y-2"
              >
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full border-2 border-[#00B9F0]"
                  />
                  <div>
                    <h4 className="font-bold text-[#2D3748]">{testimonial.name}</h4>
                    <p className="text-sm text-[#718096]">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-[#718096] italic leading-relaxed">
                  "{testimonial.comment}"
                </p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[#FED31F] text-xl">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA para más testimonios */}
          <div className="mt-16 text-center bg-gradient-to-r from-[#00B9F0]/10 to-[#7AD107]/10 rounded-3xl p-12 border border-[#00B9F0]/20">
            <h3 className="text-3xl font-bold mb-4 text-[#2D3748]">¿Quieres ser parte de nuestra comunidad?</h3>
            <p className="text-lg text-[#718096] mb-6 max-w-2xl mx-auto">
              Únete a cientos de familias que ya están transformando su experiencia educativa con Edumon
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <DevicePhoneMobileIcon className="w-6 h-6 text-[#00B9F0]" />
                <span className="text-[#2D3748] font-semibold">Disponible en Web</span>
              </div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-[#7AD107]" />
                <span className="text-[#2D3748] font-semibold">Próximamente en Play Store</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="relative py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-12 text-white">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                  ¿Listo para transformar tu escuela de padres?
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  Comienza hoy y facilita la comunicación entre familias y docentes de manera efectiva
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <span>Sin costos ocultos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <span>Soporte en español</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <span>Actualizaciones constantes</span>
                  </div>
                </div>

                <button 
                  onClick={handleLogin}
                  className="w-full sm:w-auto px-10 py-5 bg-white text-[#00B9F0] font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <span>Iniciar Sesión</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>

              <div className="relative bg-gradient-to-br from-[#01C9F4] to-[#00B9F0] p-12 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl"></div>
                  <img 
                    src="img/fondo.png" 
                    alt="Edumon" 
                    className="relative w-64 h-auto animate-float drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 bg-gradient-to-br from-[#2D3748] to-[#1a202c] text-white overflow-hidden">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <img src="/img/letras.png" alt="Edumon" className="w-40 h-auto mb-4 brightness-0 invert" />
              <p className="text-gray-300 mb-6 leading-relaxed">
                Transformando la educación en Colombia mediante tecnología innovadora 
                que conecta familias y escuelas.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00B9F0] to-[#01C9F4] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <span className="text-white font-bold">f</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7AD107] to-[#9DE831] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <span className="text-white font-bold">tw</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE327B] to-[#FF5A9D] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <span className="text-white font-bold">in</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => scrollToSection('inicio')} className="text-gray-300 hover:text-[#00B9F0] transition-colors">
                    Inicio
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('que-es')} className="text-gray-300 hover:text-[#00B9F0] transition-colors">
                    ¿Qué es Edumon?
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('caracteristicas')} className="text-gray-300 hover:text-[#00B9F0] transition-colors">
                    Características
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('equipo')} className="text-gray-300 hover:text-[#00B9F0] transition-colors">
                    Equipo
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Contacto</h4>
              <ul className="space-y-3 text-gray-300">
                <li>📧 info@edumon.co</li>
                <li>📱 +57 300 123 4567</li>
                <li>📍 Popayán, Cauca</li>
                <li>🇨🇴 Colombia</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400 mb-4">
              © 2025 Edumon — Conectando familias y escuelas para una mejor educación
            </p>
            <p className="text-sm text-gray-500">
              Desarrollado con ❤️ por Karen Veronica Mancilla & Bryan Davis Yepes
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* Burbujas decorativas */
        .bubble {
          position: fixed;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(0, 185, 240, 0.1), rgba(122, 209, 7, 0.1));
          animation: float-bubble 20s infinite ease-in-out;
          pointer-events: none;
        }
        
        .bubble-1 {
          width: 80px;
          height: 80px;
          top: 10%;
          left: 5%;
          animation-delay: 0s;
          background: linear-gradient(135deg, rgba(0, 185, 240, 0.15), rgba(1, 201, 244, 0.05));
        }
        
        .bubble-2 {
          width: 120px;
          height: 120px;
          top: 20%;
          right: 10%;
          animation-delay: 2s;
          background: linear-gradient(135deg, rgba(122, 209, 7, 0.15), rgba(157, 232, 49, 0.05));
        }
        
        .bubble-3 {
          width: 60px;
          height: 60px;
          top: 50%;
          left: 15%;
          animation-delay: 4s;
          background: linear-gradient(135deg, rgba(254, 50, 123, 0.15), rgba(255, 90, 157, 0.05));
        }
        
        .bubble-4 {
          width: 100px;
          height: 100px;
          top: 70%;
          right: 20%;
          animation-delay: 1s;
          background: linear-gradient(135deg, rgba(250, 109, 0, 0.15), rgba(255, 165, 89, 0.05));
        }
        
        .bubble-5 {
          width: 70px;
          height: 70px;
          bottom: 10%;
          left: 25%;
          animation-delay: 3s;
          background: linear-gradient(135deg, rgba(254, 211, 31, 0.15), rgba(255, 224, 102, 0.05));
        }
        
        .bubble-6 {
          width: 90px;
          height: 90px;
          top: 40%;
          right: 5%;
          animation-delay: 5s;
          background: linear-gradient(135deg, rgba(0, 185, 240, 0.12), rgba(122, 209, 7, 0.08));
        }
        
        .bubble-7 {
          width: 110px;
          height: 110px;
          bottom: 20%;
          right: 15%;
          animation-delay: 2.5s;
          background: linear-gradient(135deg, rgba(1, 201, 244, 0.12), rgba(0, 185, 240, 0.06));
        }
        
        .bubble-8 {
          width: 50px;
          height: 50px;
          top: 30%;
          left: 40%;
          animation-delay: 4.5s;
          background: linear-gradient(135deg, rgba(254, 50, 123, 0.12), rgba(122, 209, 7, 0.06));
        }
        
        @keyframes float-bubble {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translateY(-30px) translateX(20px) scale(1.1);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-60px) translateX(-20px) scale(0.9);
            opacity: 0.5;
          }
          75% {
            transform: translateY(-30px) translateX(20px) scale(1.05);
            opacity: 0.7;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mejoras de responsividad */
        @media (max-width: 640px) {
          .bubble {
            width: 40px !important;
            height: 40px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EdumonLanding;