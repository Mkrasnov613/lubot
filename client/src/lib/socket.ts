import { io, Socket } from "socket.io-client";

const sockets = new Map<string, Socket>();

export default function getSocket(tenantId: string) {
  let socket = sockets.get(tenantId);
  if (!socket) {
    socket = io("http://localhost:3000", {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      auth: { tenantId }, 
      withCredentials: true,
    });
    sockets.set(tenantId, socket);
  }
  return socket;
}
