// src/hooks/useUserPresence.js
// Marca al usuario actual como en línea/fuera de línea en el UserStore global.
// Listo para Socket.io: si se pasa un objeto `socket`, también emite
// los eventos "user:online" / "user:offline" al servidor.
import { useEffect } from "react";
import useUserStore from "@/store/useUserStore";

/**
 * @param {string|null} userId  - ID del usuario autenticado
 * @param {object|null} socket  - Instancia de socket.io opcional
 */
export default function useUserPresence(userId, socket = null) {
  const setOnline = useUserStore((s) => s.setOnline);

  useEffect(() => {
    if (!userId) return;

    // Marcar como en línea en el store global
    setOnline(userId, true);

    // Emitir al servidor si el socket está disponible
    socket?.emit("user:online", { userId });

    return () => {
      setOnline(userId, false);
      socket?.emit("user:offline", { userId });
    };
  }, [userId, socket, setOnline]);
}
