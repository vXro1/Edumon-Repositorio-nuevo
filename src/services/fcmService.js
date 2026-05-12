// src/services/fcmService.js
// Registra el FCM token del dispositivo en el backend.
// Firebase Cloud Messaging requiere que el proyecto tenga firebase configurado.
// Si no está disponible, el registro falla silenciosamente.
import { apiFetch } from './core/apiClient';

export const fcmService = {
  registerToken: async (fcmToken) => {
    return apiFetch('/users/me/fcm-token', {
      method: 'PUT',
      body: JSON.stringify({ fcmToken }),
    });
  },

  // Solicita permiso de notificaciones + obtiene token FCM de Firebase.
  // Retorna null si Firebase no está disponible o el usuario deniega permiso.
  requestToken: async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return null;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;

      // Importación dinámica: solo falla si firebase no está instalado
      const { getMessaging, getToken } = await import('firebase/messaging');
      const { getApp } = await import('firebase/app');
      const messaging = getMessaging(getApp());
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) return null;

      return await getToken(messaging, { vapidKey });
    } catch {
      return null;
    }
  },
};
