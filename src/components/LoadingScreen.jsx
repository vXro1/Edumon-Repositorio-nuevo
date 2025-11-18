import React from 'react';
import { GraduationCap } from 'lucide-react';

/**
 * Componente de carga reutilizable con diseño consistente
 * 
 * @param {Object} props
 * @param {string} props.mensaje - Mensaje principal (default: "Cargando...")
 * @param {string} props.submensaje - Mensaje secundario (default: "Por favor espera un momento")
 * @param {boolean} props.fullScreen - Si debe ocupar toda la pantalla (default: true)
 * @param {string} props.size - Tamaño del spinner: 'sm', 'md', 'lg' (default: 'md')
 * 
 * @example
 * // Uso básico - pantalla completa
 * <LoadingScreen />
 * 
 * @example
 * // Con mensajes personalizados
 * <LoadingScreen 
 *   mensaje="Cargando curso..." 
 *   submensaje="Obteniendo información actualizada" 
 * />
 * 
 * @example
 * // Como indicador inline (no pantalla completa)
 * <LoadingScreen 
 *   fullScreen={false}
 *   size="sm"
 *   mensaje="Procesando..."
 * />
 */
const LoadingScreen = ({ 
  mensaje = "Cargando...", 
  submensaje = "Por favor espera un momento",
  fullScreen = true,
  size = "md"
}) => {
  // Tamaños del spinner según el prop size
  const sizeClasses = {
    sm: {
      spinner: "h-12 w-12 border-3",
      icon: 20,
      messageText: "text-sm",
      submessageText: "text-xs"
    },
    md: {
      spinner: "h-20 w-20 border-4",
      icon: 32,
      messageText: "text-lg",
      submessageText: "text-sm"
    },
    lg: {
      spinner: "h-28 w-28 border-5",
      icon: 44,
      messageText: "text-xl",
      submessageText: "text-base"
    }
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  const containerClass = fullScreen 
    ? "min-h-screen flex items-center justify-center bg-white" 
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="relative mb-6">
          <div 
            className={`animate-spin rounded-full ${selectedSize.spinner} border-gray-200 border-t-[#00B9F0] mx-auto`}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="text-[#00B9F0]" size={selectedSize.icon} />
          </div>
        </div>
        <p className={`text-[#2D3748] font-semibold ${selectedSize.messageText}`}>
          {mensaje}
        </p>
        {submensaje && (
          <p className={`text-[#718096] ${selectedSize.submessageText} mt-2`}>
            {submensaje}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;

/**
 * Variantes adicionales del componente
 */

// Loading Inline - Para usar dentro de botones o pequeños espacios
export const LoadingInline = ({ size = 16, color = "#00B9F0" }) => (
  <div className="inline-flex items-center justify-center">
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
);

// Loading Dots - Animación de puntos
export const LoadingDots = ({ color = "#00B9F0" }) => (
  <div className="flex items-center gap-1">
    <div
      className="w-2 h-2 rounded-full animate-bounce"
      style={{ 
        backgroundColor: color,
        animationDelay: '0ms' 
      }}
    />
    <div
      className="w-2 h-2 rounded-full animate-bounce"
      style={{ 
        backgroundColor: color,
        animationDelay: '150ms' 
      }}
    />
    <div
      className="w-2 h-2 rounded-full animate-bounce"
      style={{ 
        backgroundColor: color,
        animationDelay: '300ms' 
      }}
    />
  </div>
);

// Loading Skeleton - Para cards y contenido
export const LoadingSkeleton = ({ 
  width = "100%", 
  height = "20px",
  className = "" 
}) => (
  <div 
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded ${className}`}
    style={{ width, height }}
  />
);

// Loading Card - Skeleton para tarjetas completas
export const LoadingCard = () => (
  <div className="bg-white rounded-xl shadow-md border border-[#E2E8F0] p-6 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full" />
      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-5/6" />
    </div>
  </div>
);

// Loading Overlay - Para mostrar sobre contenido existente
export const LoadingOverlay = ({ mensaje = "Procesando..." }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
      <LoadingScreen 
        fullScreen={false}
        mensaje={mensaje}
        submensaje=""
      />
    </div>
  </div>
);