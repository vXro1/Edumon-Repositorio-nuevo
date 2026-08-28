// src/lib/socket.js
// Conexión de Socket.IO — singleton a nivel de módulo, igual que apiClient.js
// (no un Context: cualquier componente puede importar getSocket() y
// suscribirse a eventos con socket.on()/off() directamente).
//
// io() SIN url conecta contra window.location.origin — a propósito, no hace
// falta apuntar a ninguna URL del backend: nginx reenvía /socket.io/ puerta
// adentro al backend por su nombre de servicio interno (ver
// nginx.conf.template), exactamente igual que ya hace con /api/. El
// navegador solo conoce el origen del frontend.
//
// La autenticación va por la cookie httpOnly de sesión (access_token) — el
// middleware de socket.io del backend la lee del handshake (ver
// socketHandlers.js). withCredentials la asegura incluso si esto deja de
// ser same-origin en algún despliegue futuro (cross-origin sí la necesita
// de verdad; same-origin la manda de todas formas).
import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  if (!socket) {
    socket = io({
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
}

export function getSocket() {
  return socket;
}
