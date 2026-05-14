// src/features/auth/context/AuthContext.jsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { authService } from "../../../services/authService";
import { registerLogoutCallback } from "../../../services/core/apiClient";
import { sessionManager } from "../../../services/core/sessionManager";
import { normalizeUser } from "@/lib/normalizers";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  // Evita múltiples ejecuciones simultáneas del logout por 401
  const handling401 = useRef(false);

  const isAuthenticated = !!token && !!user;

  // ─── Limpieza centralizada ────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    try { authService.clearAllCache?.(); } catch {}
    try { localStorage.removeItem("token"); } catch {}
    try { sessionStorage.clear(); } catch {}
  }, []);

  // ─── Logout (manual o por inactividad) ───────────────────────────────────
  const logout = useCallback(async (reason) => {
    sessionManager.stop();
    setShowWarning(false);

    try { await authService.logout(); } catch {}

    clearAll();
    setToken(null);
    setUser(null);

    const url = reason === 'expired'    ? '/login?expired=1'
              : reason === 'inactivity' ? '/login?inactivity=1'
              : '/login';

    window.location.replace(url);
  }, [clearAll]);

  // ─── Logout por 401 (desde apiClient) ────────────────────────────────────
  useEffect(() => {
    handling401.current = false;

    registerLogoutCallback(() => {
      if (handling401.current) return;
      handling401.current = true;
      logout('expired');
    });
  }, [logout]);

  // ─── Verificación de expiración del token ────────────────────────────────
  // Solo corre cada 5 minutos y solo cierra si el token REALMENTE expiró.
  // El bug anterior: jwt_decode estaba mal referenciado → siempre retornaba
  // true → cerraba sesión 60 segundos después de iniciar la app.
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      const t = authService.getToken();
      if (t && authService.isTokenExpired(t)) {
        if (!handling401.current) {
          handling401.current = true;
          logout('expired');
        }
      }
    }, 5 * 60 * 1000); // ← cada 5 minutos, no cada 60 segundos

    return () => clearInterval(interval);
  }, [token, logout]);

  // ─── sessionManager: inactividad ─────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      sessionManager.stop();
      return;
    }

    sessionManager.start({
      onWarning: () => setShowWarning(true),
      onResume:  () => setShowWarning(false),
      onExpire:  () => logout('inactivity'),
    });

    return () => sessionManager.stop();
  }, [isAuthenticated, logout]);

  // ─── Inicialización de sesión ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const savedToken = authService.getToken();

      if (!savedToken) {
        if (mounted) setLoading(false);
        return;
      }

      // Verificar si el token ya está expirado antes de hacer la petición
      if (authService.isTokenExpired(savedToken)) {
        clearAll();
        if (mounted) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }
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
    return () => { mounted = false; };
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);

    if (data?.token) {
      setToken(data.token);
      setUser(normalizeUser(data.user ?? null));
    }

    return data;
  }, []);

  // ─── Continuar sesión desde el modal de advertencia ───────────────────────
  const stayLoggedIn = useCallback(() => {
    setShowWarning(false);
    sessionManager.reset();
  }, []);

  // ─── Context value ────────────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      showWarning,
      login,
      logout,
      stayLoggedIn,
    }),
    [user, token, loading, isAuthenticated, showWarning, login, logout, stayLoggedIn]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
  return ctx;
};