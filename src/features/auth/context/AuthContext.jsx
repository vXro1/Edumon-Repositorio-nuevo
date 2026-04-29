// src/features/auth/context/AuthContext.jsx
import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { authService } from "../services/authService";
import { registerLogoutCallback } from "../../../lib/apiClient";

const AuthContext = createContext(null);

/*
 * Guard global: evita que el callback de 401 se ejecute múltiples veces
 * si hay varios requests en vuelo que fallan simultáneamente.
 */
let _handling401 = false;

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  /* ── Logout manual ── */
  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    // Limpieza de caché al cerrar sesión intencionalmente
    authService.clearAllCache();
  }, []);

  /* ── Login ── */
  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  /* ── Callback 401: sesión expirada desde cualquier request ──
   *
   * Usa window.location.replace en lugar de React Router para:
   *   1. Cortar todos los requests en vuelo de inmediato (nueva página)
   *   2. Limpiar toda la memoria de React sin race conditions
   *   3. El parámetro ?expired=1 le indica al login que muestre el aviso
   */
  useEffect(() => {
    _handling401 = false; // reset al montar/remontar

    registerLogoutCallback(() => {
      if (_handling401) return;
      _handling401 = true;

      authService.clearAllCache();

      // Hard redirect — más robusto que navigate() de React Router
      // porque aborta requests en vuelo y resetea el árbol de React
      window.location.replace("/login?expired=1");
    });
  }, []);

  /* ── Verificación inicial de sesión ──
   *
   * El flag `ignore` previene el doble-seteo de estado que ocurre en
   * React StrictMode (development), donde los efectos corren dos veces.
   */
  useEffect(() => {
    let ignore = false;

    const initAuth = async () => {
      const savedToken = authService.getToken();

      if (!savedToken) {
        if (!ignore) setLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (!ignore) {
          setUser(profile.user ?? profile);
          setToken(savedToken);
        }
      } catch {
        // Token inválido o expirado: limpia sin redirigir
        // (el usuario ya está en la app, ProtectedRoute lo mandará al login)
        if (!ignore) {
          authService.clearAllCache();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    initAuth();

    return () => { ignore = true; };
  }, []);

  const value = useMemo(
    () => ({ user, token, isAuthenticated, loading, login, logout }),
    [user, token, isAuthenticated, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
  return ctx;
};
