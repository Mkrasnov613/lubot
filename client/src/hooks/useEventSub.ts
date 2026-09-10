"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SERVER_ORIGIN } from "@/lib/config";

{/*type EventObjectType = {
  user_id: number;
  user_login: string;
  user_name: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  followed_at: string;
};
*/}
type EventSubMessage = {
  type: string; // e.g. "stream.online"
  event: unknown;
};

export function useEventSub(url = SERVER_ORIGIN) {
  const [events, setEvents] = useState<EventSubMessage[]>([]);

  useEffect(() => {
    // connect to the dedicated namespace
    const socket: Socket = io(`${url}/eventsub`, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("twitch:event", (payload: EventSubMessage) => {
      setEvents((prev) => [payload, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, [url]);

  return events;
}
