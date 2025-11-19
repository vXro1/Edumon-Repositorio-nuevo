// components/LoadingScreen.jsx
import React from "react";
import { motion } from "framer-motion";

export default function LoadingScreen({
  mensaje = "Cargando",
  submensaje = "Preparando tu experiencia educativa",
}) {
  const orbitalColors = ["#7AD107", "#FE327B", "#FF8A33"];
  const dotColors = ["#00B9F0", "#7AD107", "#FE327B"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center text-center p-8">
        
        {/* 🔵 Contenedor principal animado */}
        <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>

          {/* 🔄 Anillo giratorio con gradiente */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 140,
              height: 140,
              borderRadius: "100%",
              background: `conic-gradient(#00B9F0,#7AD107,#FE327B,#FF8A33,#00B9F0)`,
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 6px), black 0)",
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          />

          {/* ✨ Resplandor pulsante */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 110,
              height: 110,
              background: "rgba(0,185,240,0.15)",
            }}
            animate={{
              scale: [0.95, 1.1, 0.95],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* 🟣 Logo con pulsación */}
          <motion.div
            className="absolute bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden"
            style={{ width: 90, height: 90 }}
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(circle, rgba(0,185,240,0.1), white)",
              }}
            >
              <img
                src="/img/edumon.png"   // ← TU RUTA EXACTA
                alt="Logo Edumon"
                style={{
                  width: 60,
                  height: 60,
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
                draggable={false}
              />
            </div>
          </motion.div>

          {/* 🟢 Puntos orbitales animados */}
          {orbitalColors.map((color, index) => (
            <motion.div
              key={index}
              className="absolute"
              style={{ width: 140, height: 140 }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 3 + index * 0.5,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div
                className="w-3 h-3 rounded-full shadow-md"
                style={{
                  backgroundColor: color,
                  position: "absolute",
                  top: -5,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* 🔵 Puntos inferiores animados */}
        <div className="mt-10 flex items-center gap-3">
          {dotColors.map((color, index) => (
            <motion.div
              key={index}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* 🔵 Mensajes */}
        <p className="text-[#00B9F0] mt-8 text-xl font-bold">{mensaje}</p>
        <p className="text-gray-500 mt-2 text-sm font-medium">{submensaje}</p>
      </div>
    </div>
  );
}
