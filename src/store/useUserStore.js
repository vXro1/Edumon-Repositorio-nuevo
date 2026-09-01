// caché global de usuarios, búsqueda O(1) por ID. persist sobrevive recargas;
// onlineUsers no se persiste (estado efímero)
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set, get) => ({
      // { [userId]: usuarioNormalizado }
      users: {},

      // { [userId]: boolean } — efímero, no persistido
      onlineUsers: {},

      setUser(user) {
        if (!user?._id) return;
        set((s) => ({
          users: { ...s.users, [user._id]: { ...s.users[user._id], ...user } },
        }));
      },

      setUsers(list) {
        if (!list?.length) return;
        const patch = {};
        list.forEach((u) => {
          if (u?._id) patch[u._id] = u;
        });
        if (!Object.keys(patch).length) return;
        set((s) => ({ users: { ...s.users, ...patch } }));
      },

      getUser(id) {
        return get().users[id];
      },

      setOnline(userId, status) {
        if (!userId) return;
        set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: status } }));
      },

      clearCache() {
        set({ users: {}, onlineUsers: {} });
      },
    }),
    {
      name: "edumon-user-cache",
      partialize: (state) => ({ users: state.users }),
    }
  )
);

export default useUserStore;
