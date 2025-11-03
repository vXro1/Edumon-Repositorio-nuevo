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
  HeartIcon
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
  const handleRegister = () => router.push('/auth/register');

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const features = [
    {
      icon: <UserGroupIcon className="w-12 h-12 text-[#00B9F0]" />,
      title: "Para Docentes",
      description: "Crea grados, registra familias, sube tareas y comunica información de forma rápida y organizada."
    },
    {
      icon: <HeartIcon className="w-12 h-12 text-[#7AD107]" />,
      title: "Para Padres",
      description: "Recibe tareas, materiales de apoyo y recordatorios directamente en tu celular."
    },
    {
      icon: <CalendarDaysIcon className="w-12 h-12 text-[#FE327B]" />,
      title: "Calendario de Actividades",
      description: "Consulta las próximas reuniones y escuelas de padres en tiempo real."
    }
  ];

  const benefits = [
    {
      icon: <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-[#00B9F0]" />,
      title: "Comunicación directa",
      description: "Conexión constante entre docentes, padres y coordinadores."
    },
    {
      icon: <ClipboardDocumentCheckIcon className="w-8 h-8 text-[#7AD107]" />,
      title: "Entrega de tareas optimizada",
      description: "Evita revisar cientos de cuadernos físicos, todo se gestiona desde la plataforma."
    },
    {
      icon: <BookOpenIcon className="w-8 h-8 text-[#FE327B]" />,
      title: "Plataforma educativa moderna",
      description: "Diseñada para fortalecer la escuela de padres con tecnología sencilla y útil."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#2D3748]">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/90'}`}>
        <div className="container mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('inicio')}>

          <img src="/img/letras.png" alt="Edumon" className="w-50 h-20 rounded-xl" />
          </div>

          {/* Nav (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {['inicio', 'que-es', 'caracteristicas', 'contacto'].map((sec, i) => (
              <button
                key={i}
                onClick={() => scrollToSection(sec)}
                className="text-[#2D3748] hover:text-[#00B9F0] font-medium transition-colors"
              >
                {sec === 'inicio'
                  ? 'Inicio'
                  : sec === 'que-es'
                  ? '¿Qué es Edumon?'
                  : sec === 'caracteristicas'
                  ? 'Características'
                  : 'Contacto'}
              </button>
            ))}
          </nav>

          {/* Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={handleLogin} className="px-5 py-2 text-[#00B9F0] font-semibold hover:bg-[#00B9F0]/10 rounded-full transition-all">
              Iniciar Sesión
            </button>
            <button onClick={handleRegister} className="px-5 py-2 bg-[#00B9F0] text-white font-semibold rounded-full hover:shadow-lg transition-all">
              Registrarse
            </button>
          </div>

          {/* Mobile Menu Icon */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white shadow-lg mt-2 mx-3 rounded-2xl p-4 space-y-3 animate-fadeIn">
            {['inicio', 'que-es', 'caracteristicas', 'contacto'].map((sec, i) => (
              <button
                key={i}
                onClick={() => scrollToSection(sec)}
                className="block text-left w-full text-[#2D3748] hover:text-[#00B9F0] font-medium py-2"
              >
                {sec === 'inicio'
                  ? 'Inicio'
                  : sec === 'que-es'
                  ? '¿Qué es Edumon?'
                  : sec === 'caracteristicas'
                  ? 'Características'
                  : 'Contacto'}
              </button>
            ))}
            <div className="flex flex-col gap-3 pt-3 border-t border-gray-200">
              <button onClick={handleLogin} className="w-full px-5 py-3 text-[#00B9F0] border-2 border-[#00B9F0] rounded-full hover:bg-[#00B9F0]/10">
                Iniciar Sesión
              </button>
              <button onClick={handleRegister} className="w-full px-5 py-3 bg-[#00B9F0] text-white rounded-full hover:shadow-md">
                Registrarse
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="inicio" className="min-h-screen flex flex-col justify-center items-center text-center px-4 pt-24 md:pt-32">
        <div className="container mx-auto max-w-7xl grid md:grid-cols-2 items-center gap-12">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-snug">
              La forma más fácil de conectar <span className="text-[#00B9F0]">familias</span> y <span className="text-[#7AD107]">escuelas</span>
            </h1>
            <p className="text-lg text-[#718096]">
              Edumon optimiza el proceso de entrega de tareas de las escuelas de padres y mejora la comunicación con los docentes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button onClick={handleRegister} className="px-8 py-4 bg-[#00B9F0] text-white font-bold rounded-full hover:shadow-lg transform hover:scale-105 transition-all">
                Registrarme
              </button>
              <button onClick={handleLogin} className="px-8 py-4 border-2 border-[#00B9F0] text-[#00B9F0] font-bold rounded-full hover:bg-[#00B9F0]/10 transform hover:scale-105 transition-all">
                Iniciar Sesión
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <img src="img/fondo.png" alt="Edumon Mascota" className="w-56 sm:w-64 md:w-80 h-auto animate-bounce-slow" />
          </div>
        </div>
      </section>

      {/* Qué es Edumon */}
      <section id="que-es" className="py-20 bg-[#F7FAFC] px-4">
        <div className="container mx-auto max-w-7xl grid md:grid-cols-2 items-center gap-12">
          <div className="flex justify-center order-2 md:order-1">
            <BookOpenIcon className="w-40 h-40 text-[#00B9F0] opacity-30" />
          </div>
          <div className="space-y-6 order-1 md:order-2">
            <h2 className="text-3xl md:text-4xl font-bold">¿Qué es Edumon?</h2>
            <p className="text-[#718096] leading-relaxed">
              Edumon es una plataforma digital creada para fortalecer la escuela de padres en instituciones educativas.
              Permite que los docentes gestionen grados, registren familias y suban tareas con materiales de apoyo.
            </p>
            <p className="text-[#718096] leading-relaxed">
              Los padres reciben notificaciones y pueden enviar sus evidencias desde el celular, facilitando el seguimiento de las actividades.
            </p>
          </div>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Características principales</h2>
          <p className="text-[#718096] mb-12">Una herramienta pensada para docentes, padres y coordinadores</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-[#F7FAFC] p-8 rounded-3xl shadow-md hover:shadow-xl transition-all">
                <div className="flex justify-center">{f.icon}</div>
                <h3 className="text-2xl font-bold mt-4 mb-2">{f.title}</h3>
                <p className="text-[#718096]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 bg-[#F7FAFC] px-4">
        <div className="container mx-auto max-w-7xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Beneficios de usar Edumon</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-all">
                <div className="flex justify-center mb-3">{b.icon}</div>
                <h3 className="text-xl font-bold mb-2">{b.title}</h3>
                <p className="text-[#718096]">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-20 px-4 bg-white text-center">
        <div className="container mx-auto max-w-4xl space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">¿Listo para transformar tu escuela de padres?</h2>
          <p className="text-lg text-[#718096]">Empieza hoy y haz más sencilla la comunicación entre familias y docentes</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
            <button onClick={handleRegister} className="px-10 py-4 bg-[#00B9F0] text-white font-bold rounded-full hover:shadow-lg transform hover:scale-105 transition-all">
              Registrarme
            </button>
            <button onClick={handleLogin} className="px-10 py-4 border-2 border-[#00B9F0] text-[#00B9F0] font-bold rounded-full hover:bg-[#00B9F0]/10 transform hover:scale-105 transition-all">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-[#2D3748] text-center text-white">
        <p>© 2025 Edumon — Conectando familias y escuelas.</p>
      </footer>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default EdumonLanding;
