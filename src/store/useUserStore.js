// src/store/useUserStore.js
// Caché global de usuarios — fuente única de verdad para todos los datos de usuario.
// Búsqueda O(1) por ID, sin peticiones duplicadas entre módulos.
// persist: sobrevive recargas de página; onlineUsers NO se persiste (es estado efímero).
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set, get) => ({
      // { [userId]: usuarioNormalizado }
      users: {},

      // { [userId]: boolean } — efímero, no persistido
      onlineUsers: {},

      /** Inserta o actualiza un único usuario en el caché. */
      setUser(user) {
        if (!user?._id) return;
        set((s) => ({
          users: { ...s.users, [user._id]: { ...s.users[user._id], ...user } },
        }));
      },

      /** Inserta o actualiza una lista de usuarios en el caché (elimina duplicados automáticamente). */
      setUsers(list) {
        if (!list?.length) return;
        const patch = {};
        list.forEach((u) => {
          if (u?._id) patch[u._id] = u;
        });
        if (!Object.keys(patch).length) return;
        set((s) => ({ users: { ...s.users, ...patch } }));
      },

      /** Búsqueda O(1) — retorna undefined si no está en caché. */
      getUser(id) {
        return get().users[id];
      },

      /** Actualiza el estado en línea/fuera de línea de un usuario. */
      setOnline(userId, status) {
        if (!userId) return;
        set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: status } }));
      },

      /** Limpia el caché al cerrar sesión. */
      clearCache() {
        set({ users: {}, onlineUsers: {} });
      },
    }),
    {
      name: "edumon-user-cache",
      // Solo persistir users; onlineUsers es efímero (se resetea al recargar)
      partialize: (state) => ({ users: state.users }),
    }
  )
);

export default useUserStore;
