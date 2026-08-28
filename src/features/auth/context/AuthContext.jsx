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
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { normalizeUser } from "@/lib/normalizers";

export const UserContext = createContext(null);
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  const handling401 = useRef(false);

  const isAuthenticated = !!user;

  const clearAll = useCallback(() => {
    try { authService.clearAllCache?.(); } catch {}
    try { sessionStorage.clear(); } catch {}
  }, []);

  const logout = useCallback(async (reason) => {
    sessionManager.stop();
    setShowWarning(false);

    try { await authService.logout(); } catch {}

    clearAll();
    setUser(null);

    const url = reason === 'expired'    ? '/login?expired=1'
              : reason === 'inactivity' ? '/login?inactivity=1'
              : '/login';

    window.location.replace(url);
  }, [clearAll]);

  // Logout global por 401 real (sesión que expiró a mitad de uso).
  // El chequeo silencioso de /auth/profile al arrancar NO pasa por aquí
  // (lo filtra apiClient.js con silentAuth).
  useEffect(() => {
    handling401.current = false;

    registerLogoutCallback(() => {
      if (handling401.current) return;
      handling401.current = true;
      logout('expired');
    });
  }, [logout]);

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

  // Conexión de Socket.IO — mismo ciclo de vida que sessionManager arriba:
  // se conecta apenas hay sesión, se desconecta apenas se pierde (logout,
  // expiración). Un solo socket compartido para toda la app; cualquier
  // pantalla se suscribe a sus propios eventos con getSocket()?.on(...).
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    connectSocket();

    return () => disconnectSocket();
  }, [isAuthenticated]);

  // Pregunta silenciosa "¿quién soy?" usando la cookie httpOnly.
  // Si no hay sesión válida, el catch deja user en null —
  // NO navega, NO llama a logout(), NO recarga la página.
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const profile = await authService.getProfile();
        if (mounted) {
          setUser(normalizeUser(profile.user ?? profile));
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);

    if (data?.user) {
      setUser(normalizeUser(data.user));
    }

    return data;
  }, []);

  // FIX: FirstLoginScreen.jsx (y potencialmente otras pantallas) hacen
  // `const { user, updateUser } = useAuth()` y llaman a updateUser(nuevoUser)
  // después de guardar la foto de perfil o los datos en el backend.
  // Esta función nunca existió en el contexto → updateUser era `undefined`
  // → TypeError al completar el paso 1 del wizard de primer login, que
  // rompía el flujo silenciosamente antes de llegar al paso de correo/contraseña.
  const updateUser = useCallback((partialUser) => {
    if (!partialUser) return;
    setUser(prev => {
      const merged = prev ? { ...prev, ...partialUser } : partialUser;
      return normalizeUser(merged);
    });
  }, []);

  const stayLoggedIn = useCallback(() => {
    setShowWarning(false);
    sessionManager.reset();
  }, []);

  // FIX: FamiliaPerfilesPage.jsx llama a `switchProfile()` tras
  // seleccionarPerfil() — pero esa función nunca existió en el contexto
  // (`switchProfile is not a function`, crash al elegir cualquier perfil).
  // seleccionarPerfil() en el backend NO devuelve un token en el body —
  // solo reemplaza la cookie httpOnly access_token con una que lleva el
  // nuevo perfilId/esTitular. El único trabajo del frontend es volver a
  // preguntar "¿quién soy?" (mismo patrón que el chequeo silencioso al
  // arrancar la app), para que `user` refleje el perfil recién activado.
  const switchProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser(normalizeUser(profile.user ?? profile));
      return true;
    } catch {
      return false;
    }
  }, []);

  const userValue = useMemo(
    () => ({ user, isAuthenticated, login, logout, updateUser, switchProfile }),
    [user, isAuthenticated, login, logout, updateUser, switchProfile]
  );

  const fullValue = useMemo(
    () => ({ ...userValue, loading, showWarning, stayLoggedIn }),
    [userValue, loading, showWarning, stayLoggedIn]
  );

  return (
    <UserContext.Provider value={userValue}>
      <AuthContext.Provider value={fullValue}>
        {children}
      </AuthContext.Provider>
    </UserContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
  return ctx;
};

export const useUserContext = () => {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error("useUserContext debe usarse dentro de <AuthProvider>");
  return ctx;
};