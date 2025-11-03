'use client';
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
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
      {/* Fondo de burbujas suaves */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 left-20 w-32 h-32 bg-pink-300/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-32 w-48 h-48 bg-sky-300/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-10 w-40 h-40 bg-green-300/40 rounded-full blur-3xl animate-pulse" />
      </div>

      {/*  Contenedor principal más compacto */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg overflow-hidden w-[90%] max-w-3xl border border-gray-100"
      >
        {/* Izquierda: formulario */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center md:text-left">Bienvenido</h2>
          <p className="text-gray-500 mb-5 text-sm text-center md:text-left">Inicia sesión en Edumon</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-gray-700 mb-1 font-semibold text-xs">
                Teléfono
              </label>
              <div className="flex items-center border-2 border-sky-400 rounded-full px-3 py-1.5 bg-white focus-within:ring-2 focus-within:ring-sky-200 transition">
                <User className="text-sky-500" size={16} />
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="+57 3001234567"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent outline-none text-gray-800 ml-2 text-sm"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="contraseña" className="block text-gray-700 mb-1 font-semibold text-xs">
                Contraseña
              </label>
              <div className="flex items-center border-2 border-pink-400 rounded-full px-3 py-1.5 bg-white focus-within:ring-2 focus-within:ring-pink-200 transition">
                <Lock className="text-pink-500" size={16} />
                <input
                  id="contraseña"
                  name="contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.contraseña}
                  onChange={handleChange}
                  required
                  className="flex-1 bg-transparent outline-none text-gray-800 ml-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-pink-500 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botón */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className={`w-full py-2.5 rounded-full font-semibold text-white text-sm transition-all shadow-md ${
                loading
                  ? "bg-gray-400 cursor-wait"
                  : "bg-gradient-to-r from-sky-400 to-pink-400 hover:opacity-90"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Ingresando...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </motion.button>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-center text-xs mt-1 font-medium"
              >
                {error}
              </motion.p>
            )}
          </form>

          {/* Enlace registro */}
          <p className="text-center text-gray-600 mt-4 text-xs">
            ¿No tienes cuenta?{" "}
            <a
              href="/registro"
              className="text-sky-500 hover:text-pink-500 font-semibold transition"
            >
              Regístrate aquí
            </a>
          </p>
        </div>

        {/* Derecha: imagen ilustrativa */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-tr from-sky-200 via-pink-100 to-green-100 items-center justify-center relative">
          <Image
            src="/img/fondo.png"
            alt="Ilustración Edumon"
            width={200}
            height={200}
            className="object-contain drop-shadow-xl"
          />
          <div className="absolute w-56 h-56 bg-pink-300/30 rounded-full blur-3xl -z-10 top-16 right-8" />
        </div>
      </motion.div>
    </div>
  );
}
