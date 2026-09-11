// marca al usuario como en línea/fuera de línea en el UserStore global; si se
// pasa `socket` también emite "user:online"/"user:offline" al servidor
import { useEffect } from "react";
import useUserStore from "@/store/useUserStore";

export default function useUserPresence(userId, socket = null) {
  const setOnline = useUserStore((s) => s.setOnline);

  useEffect(() => {
    if (!userId) return;

    setOnline(userId, true);
    socket?.emit("user:online", { userId });

    return () => {
      setOnline(userId, false);
      socket?.emit("user:offline", { userId });
    };
  }, [userId, socket, setOnline]);
}
