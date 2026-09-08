"use client";
import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { pushActivityItem } from "@/lib/liveEvent";
import Image from "next/image";
import { timeAgo } from "@/lib/utils";
import { ActivityItem } from "@/components/ActivityFeedComponent";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex } from "@chakra-ui/react";
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

  const socketUrl = useMemo(() => API_BASE_URL, []);

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
    <Box
      className="scrollbar"
      display="flex"
      rounded="xl"
      p="3"
      mb="4"
      w="27.5rem"
      h="31.25rem"
      scrollBehavior="smooth"
      overflowX="hidden"
    >
      <Flex as="ul" direction="column" gap="5" align="center">
        {items.map((item) => (
          <Flex
            as="li"
            key={item.id}
            position="relative"
            rounded="xl"
            bgGradient="to-b"
            gradientFrom="surface2"
            gradientTo="surface"
            borderWidth="1px"
            borderColor="border"
            p="2"
            h="20"
            gap="5"
            minW="25rem"
          >
            <Image
              src={item.profile_image_url || "/default-avatar.png"}
              width={64}
              height={64}
              title={item.user_name}
              alt={item.user_name}
              style={{ borderRadius: "9999px" }}
            />
            <Flex direction="column" justify="center">
              <Flex fontWeight="bold" color="twitch" align="center" gap="2">
                {item.user_name}
                <Box
                  as="span"
                  px="2"
                  py="0.5"
                  rounded="full"
                  fontSize="10px"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  bg="color-mix(in srgb, var(--color-surface-2) 70%, transparent)"
                >
                  {item.type === "follow" ? "Follow" : "Sub"}
                </Box>
              </Flex>
            </Flex>
            <Box position="absolute" top="3" right="5" fontSize="xs" opacity={0.7}>
              {timeAgo(item.occurred_at)}
            </Box>
          </Flex>
        ))}
        {items.length === 0 && (
          <Box as="li" fontSize="xs" opacity={0.7}>
            No activity yet. Waiting for events…
          </Box>
        )}
      </Flex>
    </Box>
  );
}
