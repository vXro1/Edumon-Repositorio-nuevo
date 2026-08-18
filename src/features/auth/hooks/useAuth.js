// src/features/auth/hooks/useAuth.js
// ============================================================
// Hook personalizado para consumir el contexto de autenticación
// ============================================================

import { useAuthContext, useUserContext } from "../context/AuthContext";

// Full auth context — includes token, loading, showWarning (use for auth guards and session modals)
export const useAuth = () => useAuthContext();

// Stable user-only hook — only re-renders on login/logout, not on session state changes.
// Prefer this in layout components (Sidebar, Navbar) and permission hooks.
export const useUser = () => useUserContext();