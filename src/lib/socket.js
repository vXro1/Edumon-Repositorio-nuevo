// io() sin url conecta contra window.location.origin; nginx reenvía
// /socket.io/ al backend. Auth va por cookie httpOnly (withCredentials).
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
