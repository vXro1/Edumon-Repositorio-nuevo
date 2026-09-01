// Solicita permiso de notificaciones y registra el FCM token con el backend.
// Se llama una vez después del login exitoso desde AuthContext.
// Los errores son siempre silenciosos: FCM no es crítico.
import { useEffect, useRef } from 'react';
import { fcmService } from '../services/fcmService';

export const useFCM = (isAuthenticated) => {
  const registered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registered.current) return;

    let mounted = true;

    const register = async () => {
      try {
        const token = await fcmService.requestToken();
        if (!token || !mounted) return;
        await fcmService.registerToken(token);
        registered.current = true;
      } catch {
        // El registro FCM no es crítico, siempre silencioso
      }
    };

    register();
    return () => { mounted = false; };
  }, [isAuthenticated]);
};
