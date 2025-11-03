'use client';

import React, { useState } from 'react';
import '@/app/globals.css';

// Datos quemados de usuarios
const USUARIOS_DB = [
  {
    celular: '3001234567',
    cedula: '1234567890',
    nombres: 'Juan Carlos',
    apellidos: 'Pérez González',
    correo: 'juan.perez@example.com',
    registroCompleto: true,
    fechaNacimiento: '1990-05-15',
    genero: 'masculino',
    direccion: 'Calle 123 #45-67',
    ciudad: 'Popayán',
    departamento: 'Cauca',
    nivelEducativo: 'universitario',
    ocupacion: 'Ingeniero',
    telefonoEmergencia: '3001111111',
    nombreEmergencia: 'María Pérez',
    foto: ''
  },
  {
    celular: '3109876543',
    cedula: '0987654321',
    nombres: '',
    apellidos: '',
    correo: '',
    registroCompleto: false
  },
  {
    celular: '3156789012',
    cedula: '5555555555',
    nombres: 'María',
    apellidos: 'Rodríguez',
    correo: '',
    registroCompleto: false
  }
];

const Burbuja = ({ top, left, right, bottom, size, color, opacity }) => (
  <div 
    className="absolute rounded-full pointer-events-none"
    style={{
      top,
      left,
      right,
      bottom,
      width: size,
      height: size,
      backgroundColor: color,
      opacity
    }}
  />
);

const AuthSystem = () => {
  const [vista, setVista] = useState('login');
  const [celular, setCelular] = useState('');
  const [cedula, setCedula] = useState('');
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [error, setError] = useState('');
  
  // Estados del formulario de registro
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    fechaNacimiento: '',
    genero: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    nivelEducativo: '',
    ocupacion: '',
    telefonoEmergencia: '',
    nombreEmergencia: '',
    nuevaContrasena: '',
    confirmarContrasena: '',
    foto: ''
  });

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const usuario = USUARIOS_DB.find(
      u => u.celular === celular && u.cedula === cedula
    );

    if (usuario) {
      setUsuarioActual(usuario);
      
      if (!usuario.registroCompleto) {
        // Autocompletar datos existentes
        setFormData({
          nombres: usuario.nombres || '',
          apellidos: usuario.apellidos || '',
          correo: usuario.correo || '',
          fechaNacimiento: usuario.fechaNacimiento || '',
          genero: usuario.genero || '',
          direccion: usuario.direccion || '',
          ciudad: usuario.ciudad || '',
          departamento: usuario.departamento || '',
          nivelEducativo: usuario.nivelEducativo || '',
          ocupacion: usuario.ocupacion || '',
          telefonoEmergencia: usuario.telefonoEmergencia || '',
          nombreEmergencia: usuario.nombreEmergencia || '',
          nuevaContrasena: '',
          confirmarContrasena: '',
          foto: usuario.foto || ''
        });
        setVista('registro');
      } else {
        setVista('dashboard');
      }
    } else {
      setError('Celular o cédula incorrectos');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompletarRegistro = (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.nombres || !formData.apellidos || !formData.correo) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.nuevaContrasena && formData.nuevaContrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.nuevaContrasena && formData.nuevaContrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Actualizar usuario
    const index = USUARIOS_DB.findIndex(u => u.celular === usuarioActual.celular);
    if (index !== -1) {
      USUARIOS_DB[index] = {
        ...USUARIOS_DB[index],
        ...formData,
        cedula: formData.nuevaContrasena || USUARIOS_DB[index].cedula,
        registroCompleto: true
      };
      setUsuarioActual(USUARIOS_DB[index]);
      setVista('dashboard');
    }
  };

  const handleLogout = () => {
    setVista('login');
    setCelular('');
    setCedula('');
    setUsuarioActual(null);
    setFormData({
      nombres: '',
      apellidos: '',
      correo: '',
      fechaNacimiento: '',
      genero: '',
      direccion: '',
      ciudad: '',
      departamento: '',
      nivelEducativo: '',
      ocupacion: '',
      telefonoEmergencia: '',
      nombreEmergencia: '',
      nuevaContrasena: '',
      confirmarContrasena: '',
      foto: ''
    });
    setError('');
  };

  const InputField = ({ label, type = "text", value, onChange, placeholder, required = false, disabled = false, options = null }) => (
    <div>
      <label className="block text-sm font-medium mb-2 text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all ${
            disabled ? 'bg-gray-100 opacity-60 cursor-not-allowed text-gray-500' : 'bg-blue-50 bg-opacity-40'
          }`}
        >
          <option value="">Selecciona una opción</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all ${
            disabled ? 'bg-gray-100 opacity-60 cursor-not-allowed text-gray-500' : 'bg-blue-50 bg-opacity-40'
          }`}
        />
      )}
    </div>
  );

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
        <span className="text-3xl font-bold text-white">E</span>
      </div>
    </div>
  );

  const InfoCard = ({ label, value, bgColor }) => (
    <div className={`p-4 rounded-xl ${bgColor}`}>
      <p className="text-xs font-medium mb-1 text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value || 'No especificado'}</p>
    </div>
  );

  const ActionCard = ({ emoji, text, onClick }) => (
    <button 
      onClick={onClick}
      className="p-6 rounded-xl text-center bg-gradient-to-br from-gray-50 to-gray-100 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md hover:shadow-lg"
    >
      <div className="text-3xl mb-2">{emoji}</div>
      <p className="font-medium text-gray-900">{text}</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Burbujas decorativas */}
      <div className="absolute inset-0 pointer-events-none">
        <Burbuja top="40px" left="40px" size="128px" color="#00B9F0" opacity={0.15} />
        <Burbuja top="160px" right="80px" size="96px" color="#7AD107" opacity={0.12} />
        <Burbuja bottom="128px" left="25%" size="160px" color="#FE327B" opacity={0.08} />
        <Burbuja top="50%" right="40px" size="112px" color="#01C9F4" opacity={0.15} />
        <Burbuja bottom="40px" right="33%" size="144px" color="#FA6D00" opacity={0.12} />
        <Burbuja top="80px" left="50%" size="80px" color="#FED31F" opacity={0.2} />
        <Burbuja bottom="160px" left="80px" size="96px" color="#00B9F0" opacity={0.08} />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
        {vista === 'login' && (
          <div className="w-full max-w-md">
            <Logo />
            <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">Bienvenido</h1>
            <p className="text-sm text-center text-gray-600 mb-8">Ingresa tus datos para continuar</p>

            <div className="bg-white bg-opacity-95 rounded-3xl shadow-2xl p-8 backdrop-blur-sm">
              <form onSubmit={handleLogin}>
                <div className="space-y-6">
                  <InputField
                    label="Número de Celular"
                    type="text"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    placeholder="3001234567"
                    required
                  />

                  <InputField
                    label="Cédula (Contraseña)"
                    type="password"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="••••••••••"
                    required
                  />

                  {error && (
                    <div className="p-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all active:scale-95 shadow-lg"
                  >
                    Ingresar
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  Usuarios de prueba: 3001234567 / 3109876543 / 3156789012
                </p>
              </div>
            </div>
          </div>
        )}

        {vista === 'registro' && (
          <div className="w-full max-w-4xl">
            <Logo />
            <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">Completa tu Registro</h1>
            <p className="text-sm text-center text-gray-600 mb-8">
              Por favor completa tu información para acceder a la plataforma
            </p>

            <div className="bg-white bg-opacity-95 rounded-3xl shadow-2xl p-8 backdrop-blur-sm">
              <form onSubmit={handleCompletarRegistro}>
                {/* Información Personal */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3 text-sm">1</span>
                    Información Personal
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Nombres"
                      value={formData.nombres}
                      onChange={(e) => handleInputChange('nombres', e.target.value)}
                      placeholder="Juan Carlos"
                      required
                    />
                    <InputField
                      label="Apellidos"
                      value={formData.apellidos}
                      onChange={(e) => handleInputChange('apellidos', e.target.value)}
                      placeholder="Pérez González"
                      required
                    />
                    <InputField
                      label="Correo Electrónico"
                      type="email"
                      value={formData.correo}
                      onChange={(e) => handleInputChange('correo', e.target.value)}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                    <InputField
                      label="Celular (No editable)"
                      value={usuarioActual?.celular || ''}
                      disabled
                    />
                    <InputField
                      label="Fecha de Nacimiento"
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                      required
                    />
                    <InputField
                      label="Género"
                      value={formData.genero}
                      onChange={(e) => handleInputChange('genero', e.target.value)}
                      required
                      options={[
                        { value: 'masculino', label: 'Masculino' },
                        { value: 'femenino', label: 'Femenino' },
                        { value: 'otro', label: 'Otro' },
                        { value: 'prefiero-no-decir', label: 'Prefiero no decir' }
                      ]}
                    />
                  </div>
                </div>

                {/* Información de Ubicación */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center mr-3 text-sm">2</span>
                    Ubicación
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <InputField
                        label="Dirección"
                        value={formData.direccion}
                        onChange={(e) => handleInputChange('direccion', e.target.value)}
                        placeholder="Calle 123 #45-67"
                        required
                      />
                    </div>
                    <InputField
                      label="Ciudad"
                      value={formData.ciudad}
                      onChange={(e) => handleInputChange('ciudad', e.target.value)}
                      placeholder="Popayán"
                      required
                    />
                    <InputField
                      label="Departamento"
                      value={formData.departamento}
                      onChange={(e) => handleInputChange('departamento', e.target.value)}
                      placeholder="Cauca"
                      required
                    />
                  </div>
                </div>

                {/* Información Académica/Profesional */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center mr-3 text-sm">3</span>
                    Información Académica
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Nivel Educativo"
                      value={formData.nivelEducativo}
                      onChange={(e) => handleInputChange('nivelEducativo', e.target.value)}
                      required
                      options={[
                        { value: 'primaria', label: 'Primaria' },
                        { value: 'secundaria', label: 'Secundaria' },
                        { value: 'tecnico', label: 'Técnico' },
                        { value: 'tecnologo', label: 'Tecnólogo' },
                        { value: 'universitario', label: 'Universitario' },
                        { value: 'posgrado', label: 'Posgrado' }
                      ]}
                    />
                    <InputField
                      label="Ocupación"
                      value={formData.ocupacion}
                      onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                      placeholder="Estudiante, Ingeniero, etc."
                      required
                    />
                  </div>
                </div>

                {/* Contacto de Emergencia */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center mr-3 text-sm">4</span>
                    Contacto de Emergencia
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Nombre del Contacto"
                      value={formData.nombreEmergencia}
                      onChange={(e) => handleInputChange('nombreEmergencia', e.target.value)}
                      placeholder="María Pérez"
                      required
                    />
                    <InputField
                      label="Teléfono de Emergencia"
                      type="tel"
                      value={formData.telefonoEmergencia}
                      onChange={(e) => handleInputChange('telefonoEmergencia', e.target.value)}
                      placeholder="3001111111"
                      required
                    />
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center mr-3 text-sm">5</span>
                    Cambiar Contraseña (Opcional)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Nueva Contraseña"
                      type="password"
                      value={formData.nuevaContrasena}
                      onChange={(e) => handleInputChange('nuevaContrasena', e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <InputField
                      label="Confirmar Contraseña"
                      type="password"
                      value={formData.confirmarContrasena}
                      onChange={(e) => handleInputChange('confirmarContrasena', e.target.value)}
                      placeholder="Repite la contraseña"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Si no deseas cambiar tu contraseña, deja estos campos vacíos.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl text-white font-medium bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all active:scale-95 shadow-lg"
                  >
                    Completar Registro
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {vista === 'dashboard' && (
          <div className="w-full max-w-3xl">
            <Logo />
            <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">¡Bienvenido!</h1>

            <div className="bg-white bg-opacity-95 rounded-3xl shadow-2xl p-8 mb-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {usuarioActual?.nombres} {usuarioActual?.apellidos}
                </h2>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-pink-50 text-pink-600 hover:bg-pink-100 transition-all border border-pink-200"
                >
                  Cerrar Sesión
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label="Correo" value={usuarioActual?.correo} bgColor="bg-blue-50" />
                <InfoCard label="Celular" value={usuarioActual?.celular} bgColor="bg-green-50" />
                <InfoCard label="Ciudad" value={usuarioActual?.ciudad} bgColor="bg-purple-50" />
                <InfoCard label="Ocupación" value={usuarioActual?.ocupacion} bgColor="bg-orange-50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionCard emoji="📚" text="Mis Cursos" onClick={() => alert('Mis Cursos')} />
              <ActionCard emoji="📊" text="Progreso" onClick={() => alert('Progreso')} />
              <ActionCard emoji="⚙️" text="Configuración" onClick={() => alert('Configuración')} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSystem;