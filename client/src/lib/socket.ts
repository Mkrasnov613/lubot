import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/config";

const sockets = new Map<string, Socket>();

export default function getSocket(tenantId: string) {
  let socket = sockets.get(tenantId);
  if (!socket) {
    socket = io(API_BASE_URL, {
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
