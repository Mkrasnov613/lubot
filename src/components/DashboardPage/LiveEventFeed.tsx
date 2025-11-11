"use client";
import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { pushActivityItem } from "@/lib/liveEvent";
import Image from "next/image";
import { timeAgo } from "@/lib/utils";
import { ActivityItem } from "@/app/[slug]/dashboard/page";
type EventSubPayload =
  | {
      type: "channel.follow";
      event: { user_id: string; user_name: string; followed_at: string };
      occurred_at?: string;
    }
  | {
      type: "channel.subscribe";
      event: {
        user_id: string;
        user_name: string;
        tier: string;
        is_gift: boolean;
      };
      occurred_at?: string;
    }
  | {
      type: string;
      event: any;
      occurred_at?: string;
    };

export default function LiveEventFeed({
  initialData = [] as ActivityItem[],
}: {
  initialData: ActivityItem[];
}) {
  const [items, setItems] = useState<ActivityItem[]>(initialData);

  const socketUrl = useMemo(() => "http://localhost:3000", []);

  useEffect(() => {
    const socket: Socket = io(`${socketUrl}/eventsub`, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("twitch:event", (p: EventSubPayload) => {
      if (p.type === "channel.follow") {
        const { user_id, user_name, followed_at } = p.event;

        const occurred_at =
          followed_at || p.occurred_at || new Date().toISOString();

        pushActivityItem(
          {
            id: `follow:${user_id}:${occurred_at}`,
            user_id,
            user_name,
            type: "follow",
            occurred_at,
          },
          setItems
        );
      }

      if (p.type === "channel.subscribe") {
        const { user_id, user_name } = p.event;

        const occurred_at = p.occurred_at || new Date().toISOString();

        pushActivityItem(
          {
            id: `sub:${user_id}:${occurred_at}`,
            user_id,
            user_name,
            type: "sub",
            occurred_at,
          },
          setItems
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [socketUrl]);

  return (
    <div className="rounded-xl p-3 max-h-[380px] overflow-y-scroll scroll-smooth scrollbar">
      <ul className="space-y-4 w-[400px]">
        {items.map((item) => (
          <li
            key={item.id}
            className="relative rounded-xl bg-gradient-to-b from-bg3 to-bg2 border-1 border-border p-2 flex h-20 gap-5"
          >
            <Image
              src={item.profile_image_url || "/default-avatar.png"}
              width={64}
              height={64}
              title={item.user_name}
              alt={item.user_name}
              className="rounded-full"
            />
            <div className="flex flex-col justify-center">
              <div className="font-bold text-twitch flex items-center gap-2">
                {item.user_name}
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-bg3/70">
                  {item.type === "follow" ? "Follow" : "Sub"}
                </span>
              </div>
            </div>
            <div className="absolute top-3 right-5 text-xs opacity-70">
              {timeAgo(item.occurred_at)}
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-xs opacity-70">
            No activity yet. Waiting for events…
          </li>
        )}
      </ul>
    </div>
  );
}
