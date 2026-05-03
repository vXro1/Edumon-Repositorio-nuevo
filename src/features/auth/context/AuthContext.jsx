// src/features/auth/context/AuthContext.jsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import { authService } from "../../../services/authService";
import { registerLogoutCallback } from "../../../services/core/apiClient";
import { normalizeUser } from "@/lib/normalizers";

export const AuthContext = createContext(null);

/**
 * Evita múltiples ejecuciones simultáneas del logout por 401
 */
let _handling401 = false;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  /**
   * Limpieza centralizada
   */
  const clearAll = useCallback(() => {
    try {
      authService.clearAllCache?.();
    } catch {}

    try {
      localStorage.removeItem("token");
    } catch {}

    try {
      sessionStorage.clear();
    } catch {}
  }, []);

  /**
   * Logout global por 401 (desde apiClient)
   */
  useEffect(() => {
    _handling401 = false;

    registerLogoutCallback(() => {
      if (_handling401) return;
      _handling401 = true;

      clearAll();

      setToken(null);
      setUser(null);

      window.location.replace("/login?expired=1");
    });

    // auto-logout by token expiration (check every 60s)
    const interval = setInterval(() => {
      const t = authService.getToken();
      if (t && authService.isTokenExpired?.(t)) {
        // single-run: trigger redirect and cleanup
        if (!_handling401) {
          _handling401 = true;
          try { authService.clearAllCache?.(); } catch {}
          window.location.replace('/login?expired=1');
        }
      }
    }, 60 * 1000);

    return () => { clearInterval(interval); };
  }, [clearAll]);

  /**
   * Inicialización de sesión
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const savedToken = authService.getToken();

      if (!savedToken) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile();

        if (mounted) {
          setUser(normalizeUser(profile.user ?? profile));
          setToken(savedToken);
        }
      } catch {
        clearAll();

        if (mounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [clearAll]);

  /**
   * LOGIN
   */
  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);

    if (data?.token) {
      // authService is responsible for persisting token; context keeps in-memory state
      setToken(data.token);
      setUser(normalizeUser(data.user ?? null));
    }

    return data;
  }, []);

  /**
   * LOGOUT manual
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}

    clearAll();

    setToken(null);
    setUser(null);
  }, [clearAll]);

  /**
   * Memo del contexto (evita rerenders innecesarios)
   */
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      login,
      logout
    }),
    [user, token, loading, isAuthenticated, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook seguro
 */
export const useAuthContext = () => {
  const ctx = React.useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuthContext debe usarse dentro de <AuthProvider>"
    );
  }

  return ctx;
};