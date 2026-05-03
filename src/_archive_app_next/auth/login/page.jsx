'use client';
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, Loader2, ArrowLeft, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import "@/app/globals.css";

const API_BASE_URL = "https://backend-edumon.onrender.com";

export default function Login() {
  const [formData, setFormData] = useState({ telefono: "", contraseña: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al iniciar sesión");

      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      const rol = data.user?.rol || data.rol;
      if (rol === "docente") window.location.href = "/profesor";
      else if (rol === "padre") window.location.href = "/padre-de-familia";
      else if (rol === "administrador") window.location.href = "/admin";
      else window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Error al iniciar sesión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-white">
      {/* Burbujas decorativas animadas de fondo */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="bubble-login bubble-login-1"></div>
        <div className="bubble-login bubble-login-2"></div>
        <div className="bubble-login bubble-login-3"></div>
        <div className="bubble-login bubble-login-4"></div>
        <div className="bubble-login bubble-login-5"></div>
        <div className="bubble-login bubble-login-6"></div>
      </div>

      {/* Botón de regreso */}
      <motion.a
        href="/"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
      >
        <ArrowLeft className="w-5 h-5 text-[#00B9F0] group-hover:-translate-x-1 transition-transform" />
        <span className="text-[#2D3748] font-semibold">Volver al inicio</span>
      </motion.a>

      {/* Contenedor principal del formulario */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col lg:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden w-[95%] max-w-4xl border border-gray-100"
      >
        {/* Panel izquierdo: Formulario */}
        <div className="w-full lg:w-1/2 p-8 lg:p-10 flex flex-col justify-center">
          {/* Título */}
          <div className="text-center lg:text-left mb-8">
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl lg:text-4xl font-extrabold mb-2"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B9F0] via-[#FE327B] to-[#7AD107]">
                ¡Bienvenido!
              </span>
            </motion.h2>
            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[#718096] text-base"
            >
              Ingresa a tu cuenta de Edumon
            </motion.p>
          </div>

          {/* Formulario */}
          <div className="space-y-6">
            {/* Campo de teléfono */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="telefono" className="block text-[#2D3748] mb-2 font-semibold text-sm flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#00B9F0]" />
                Número de teléfono
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00B9F0] to-[#01C9F4] rounded-2xl blur-sm opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative flex items-center border-2 border-[#00B9F0]/30 rounded-2xl px-4 py-3.5 bg-white focus-within:border-[#00B9F0] focus-within:shadow-lg transition-all">
                  <User className="text-[#00B9F0] flex-shrink-0" size={20} />
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent outline-none text-[#2D3748] ml-3 text-base placeholder:text-[#718096]"
                  />
                </div>
              </div>
            </motion.div>

            {/* Campo de contraseña */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label htmlFor="contraseña" className="block text-[#2D3748] mb-2 font-semibold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7AD107]" />
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#7AD107] to-[#9DE831] rounded-2xl blur-sm opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative flex items-center border-2 border-[#7AD107]/30 rounded-2xl px-4 py-3.5 bg-white focus-within:border-[#7AD107] focus-within:shadow-lg transition-all">
                  <Lock className="text-[#7AD107] flex-shrink-0" size={20} />
                  <input
                    id="contraseña"
                    name="contraseña"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.contraseña}
                    onChange={handleChange}
                    required
                    className="flex-1 bg-transparent outline-none text-[#2D3748] ml-3 text-base placeholder:text-[#718096]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#718096] hover:text-[#7AD107] transition-colors ml-2"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Mensaje de error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
              >
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Botón de inicio de sesión */}
            <motion.button
              onClick={handleSubmit}
              whileTap={{ scale: 0.98 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-white text-base transition-all shadow-lg hover:shadow-xl relative overflow-hidden group ${
                loading
                  ? "bg-gray-400 cursor-wait"
                  : "bg-gradient-to-r from-[#00B9F0] to-[#01C9F4] hover:from-[#01C9F4] hover:to-[#00B9F0]"
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <motion.span
                      className="inline-block"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      →
                    </motion.span>
                  </>
                )}
              </span>
              {!loading && (
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              )}
            </motion.button>
          </div>

          {/* Enlace de registro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-[#718096] text-sm">
              ¿No tienes una cuenta?{" "}
              <a
                href="/registro"
                className="text-[#00B9F0] hover:text-[#01C9F4] font-bold transition-colors hover:underline"
              >
                Regístrate aquí
              </a>
            </p>
          </motion.div>

          {/* Información adicional */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 pt-6 border-t border-gray-200"
          >
            <div className="flex items-center justify-center gap-4 text-xs text-[#718096]">
              <a href="#" className="hover:text-[#00B9F0] transition-colors">Ayuda</a>
              <span>•</span>
              <a href="#" className="hover:text-[#00B9F0] transition-colors">Privacidad</a>
              <span>•</span>
              <a href="#" className="hover:text-[#00B9F0] transition-colors">Términos</a>
            </div>
          </motion.div>
        </div>

        {/* Panel derecho: Ilustración */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#00B9F0] via-[#FE327B] to-[#7AD107] relative overflow-hidden">
          {/* Burbujas decorativas en el panel */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 right-20 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute top-1/3 left-1/3 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          {/* Contenido del panel */}
          <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl"></div>
              <Image
                src="/img/fondo.png"
                alt="Edumon Mascota"
                width={320}
                height={320}
                className="relative drop-shadow-2xl animate-float"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Estilos de las burbujas */}
      <style jsx>{`
        .bubble-login {
          position: fixed;
          border-radius: 50%;
          animation: float-bubble-login 15s infinite ease-in-out;
          pointer-events: none;
        }
        
        .bubble-login-1 {
          width: 100px;
          height: 100px;
          top: 10%;
          left: 5%;
          background: linear-gradient(135deg, rgba(0, 185, 240, 0.15), rgba(1, 201, 244, 0.05));
          animation-delay: 0s;
        }
        
        .bubble-login-2 {
          width: 150px;
          height: 150px;
          top: 60%;
          left: 10%;
          background: linear-gradient(135deg, rgba(122, 209, 7, 0.15), rgba(157, 232, 49, 0.05));
          animation-delay: 2s;
        }
        
        .bubble-login-3 {
          width: 80px;
          height: 80px;
          top: 30%;
          right: 15%;
          background: linear-gradient(135deg, rgba(254, 50, 123, 0.15), rgba(255, 90, 157, 0.05));
          animation-delay: 4s;
        }
        
        .bubble-login-4 {
          width: 120px;
          height: 120px;
          bottom: 15%;
          right: 8%;
          background: linear-gradient(135deg, rgba(250, 109, 0, 0.15), rgba(255, 165, 89, 0.05));
          animation-delay: 1s;
        }
        
        .bubble-login-5 {
          width: 90px;
          height: 90px;
          top: 50%;
          right: 30%;
          background: linear-gradient(135deg, rgba(254, 211, 31, 0.15), rgba(255, 224, 102, 0.05));
          animation-delay: 3s;
        }
        
        .bubble-login-6 {
          width: 110px;
          height: 110px;
          bottom: 30%;
          left: 20%;
          background: linear-gradient(135deg, rgba(1, 201, 244, 0.12), rgba(0, 185, 240, 0.06));
          animation-delay: 5s;
        }
        
        @keyframes float-bubble-login {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.6;
          }
          33% {
            transform: translateY(-30px) translateX(20px) scale(1.1);
            opacity: 0.8;
          }
          66% {
            transform: translateY(-15px) translateX(-20px) scale(0.95);
            opacity: 0.5;
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

        @media (max-width: 1024px) {
          .bubble-login {
            width: 60px !important;
            height: 60px !important;
          }
        }
      `}</style>
    </div>
  );
}