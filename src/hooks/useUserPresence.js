// src/hooks/useUserPresence.js
// Marks the current user as online/offline in the global UserStore.
// Socket.io-ready: if a `socket` object is passed, it also emits
// "user:online" / "user:offline" events to the server.
import { useEffect } from "react";
import useUserStore from "@/store/useUserStore";

/**
 * @param {string|null} userId  - ID of the authenticated user
 * @param {object|null} socket  - Optional socket.io socket instance
 */
export default function useUserPresence(userId, socket = null) {
  const setOnline = useUserStore((s) => s.setOnline);

  useEffect(() => {
    if (!userId) return;

    // Mark online in the global store
    setOnline(userId, true);

    // Emit to server if socket is available
    socket?.emit("user:online", { userId });

    return () => {
      setOnline(userId, false);
      socket?.emit("user:offline", { userId });
    };
  }, [userId, socket, setOnline]);
}
