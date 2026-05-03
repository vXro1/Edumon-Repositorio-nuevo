// src/store/useUserStore.js
// Global user cache — single source of truth for all user data.
// O(1) lookup by ID, no duplicate fetches across modules.
import { create } from "zustand";

const useUserStore = create((set, get) => ({
  // { [userId]: normalizedUser }
  users: {},

  // { [userId]: boolean }
  onlineUsers: {},

  /** Upsert a single user into the cache. */
  setUser(user) {
    if (!user?._id) return;
    set((s) => ({
      users: { ...s.users, [user._id]: { ...s.users[user._id], ...user } },
    }));
  },

  /** Upsert a list of users into the cache (deduplicates automatically). */
  setUsers(list) {
    if (!list?.length) return;
    const patch = {};
    list.forEach((u) => {
      if (u?._id) patch[u._id] = u;
    });
    if (!Object.keys(patch).length) return;
    set((s) => ({ users: { ...s.users, ...patch } }));
  },

  /** O(1) lookup — returns undefined if not cached. */
  getUser(id) {
    return get().users[id];
  },

  /** Update the online/offline status for one user. */
  setOnline(userId, status) {
    if (!userId) return;
    set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: status } }));
  },
}));

export default useUserStore;
