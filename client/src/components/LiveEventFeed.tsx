"use client";
import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { pushActivityItem } from "@/lib/liveEvent";
import Image from "next/image";
import { timeAgo } from "@/lib/utils";
import { ActivityItem } from "@/components/ActivityFeedComponent";
import { SERVER_ORIGIN } from "@/lib/config";
import { Badge, Box, Flex, Text } from "@chakra-ui/react";
import Panel from "@/components/Panel";

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
      event: Record<string, unknown>;
      occurred_at?: string;
    };

export default function LiveEventFeed({
  initialData = [] as ActivityItem[],
}: {
  initialData: ActivityItem[];
}) {
  const [items, setItems] = useState<ActivityItem[]>(initialData);
  /**
   * The most recent arrival since this page loaded gets a lit edge. It's
   * state, not an animation — it stays until something newer lands, so a
   * glance from across the room still shows what just happened.
   */
  const [newestId, setNewestId] = useState<string | null>(null);

  const socketUrl = useMemo(() => SERVER_ORIGIN, []);

  useEffect(() => {
    const socket: Socket = io(`${socketUrl}/eventsub`, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("twitch:event", (p: EventSubPayload) => {
      if (p.type === "channel.follow") {
        const { user_id, user_name, followed_at } = p.event as {
          user_id: string;
          user_name: string;
          followed_at: string;
        };

        const occurred_at =
          followed_at || p.occurred_at || new Date().toISOString();
        const id = `follow:${user_id}:${occurred_at}`;

        pushActivityItem(
          {
            id,
            user_id,
            user_name,
            type: "follow",
            occurred_at,
          },
          setItems,
        );
        setNewestId(id);
      }

      if (p.type === "channel.subscribe") {
        const { user_id, user_name } = p.event as {
          user_id: string;
          user_name: string;
        };

        const occurred_at = p.occurred_at || new Date().toISOString();
        const id = `sub:${user_id}:${occurred_at}`;

        pushActivityItem(
          {
            id,
            user_id,
            user_name,
            type: "sub",
            occurred_at,
          },
          setItems,
        );
        setNewestId(id);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [socketUrl]);

  return (
    <Panel
      label="Activity"
      flush
      action={
        items.length > 0 ? (
          <Text className="mono" fontSize="2xs" color="engrave">
            {items.length}
          </Text>
        ) : null
      }
    >
      {items.length === 0 ? (
        <Flex
          direction="column"
          align="flex-start"
          gap="1"
          p="var(--panel-pad)"
        >
          <Text fontSize="sm" color="text">
            Nothing yet today
          </Text>
          <Text fontSize="xs" color="engrave">
            Follows and subs land here the moment they happen.
          </Text>
        </Flex>
      ) : (
        <Box
          as="ul"
          maxH="340px"
          overflowY="auto"
          className="scrollbar"
          listStyleType="none"
        >
          {items.map((item) => {
            const isNewest = item.id === newestId;
            return (
              <Flex
                as="li"
                key={item.id}
                align="center"
                gap="2.5"
                px="3"
                py="2"
                borderBottomWidth="1px"
                borderColor="seam"
                borderLeftWidth="2px"
                borderLeftColor={isNewest ? "signal" : "transparent"}
                bg={isNewest ? "signalTint" : "transparent"}
                _last={{ borderBottomWidth: 0 }}
              >
                <Image
                  src={item.profile_image_url || "/default-avatar.png"}
                  width={28}
                  height={28}
                  alt=""
                  style={{
                    borderRadius: "var(--radius-xs)",
                    flexShrink: 0,
                  }}
                />
                <Text fontSize="sm" fontWeight="semibold" truncate minW="0">
                  {item.user_name}
                </Text>
                <Badge tone={item.type === "sub" ? "signal" : "neutral"}>
                  {item.type === "sub" ? "Sub" : "Follow"}
                </Badge>
                <Text
                  className="mono"
                  fontSize="2xs"
                  color="faint"
                  ml="auto"
                  flexShrink={0}
                >
                  {timeAgo(item.occurred_at)}
                </Text>
              </Flex>
            );
          })}
        </Box>
      )}
    </Panel>
  );
}
