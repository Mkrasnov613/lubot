"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Box, Flex, Text } from "@chakra-ui/react";
import { API_BASE_URL, SERVER_ORIGIN } from "@/lib/config";

type StreamState =
  | { status: "checking" }
  | { status: "off" }
  | { status: "on"; startedAt: string; viewers: number };

/** h:mm:ss once past an hour, m:ss before that. Tabular figures keep it still. */
function uptime(startedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * The on-air tally: the one thing on this screen that has to be readable from
 * across the room, since the dashboard lives on a second monitor and gets
 * glances rather than attention.
 *
 * Red is reserved for this lamp across the whole app (see globals.css), so
 * red anywhere on screen means exactly one thing: you are broadcasting.
 *
 * Load reads the real state from Helix; the EventSub socket keeps it current
 * after that. Without the fetch, a page refreshed mid-broadcast would sit on
 * "off air" until the next transition — a tally that lies is worse than none.
 */
export default function TallyLight() {
  const [state, setState] = useState<StreamState>({ status: "checking" });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/twitch/stream`, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setState(
          data.live
            ? {
                status: "on",
                startedAt: data.startedAt,
                viewers: data.viewers ?? 0,
              }
            : { status: "off" },
        );
      } catch (e) {
        // An unreachable status check is not evidence of being off air, but
        // "off" is the honest fallback — it claims nothing.
        if ((e as Error)?.name !== "AbortError") setState({ status: "off" });
      }
    })();

    return () => controller.abort();
  }, []);

  // Realtime transitions. `stream.online` carries started_at; `stream.offline`
  // isn't subscribed server-side yet, so going dark still needs a reload.
  useEffect(() => {
    const socket: Socket = io(`${SERVER_ORIGIN}/eventsub`, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("twitch:event", (payload: { type: string; event?: unknown }) => {
      if (payload.type === "stream.online") {
        const event = payload.event as { started_at?: string } | undefined;
        setState({
          status: "on",
          startedAt: event?.started_at ?? new Date().toISOString(),
          viewers: 0,
        });
      }
      if (payload.type === "stream.offline") setState({ status: "off" });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Only tick while there's a clock on screen.
  useEffect(() => {
    if (state.status !== "on") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.status]);

  if (state.status === "checking") {
    return (
      <Flex align="center" gap="2" h="26px" px="2">
        <Lamp color="seam" />
        <Text fontSize="xs" color="faint">
          Checking
        </Text>
      </Flex>
    );
  }

  if (state.status === "off") {
    return (
      <Flex align="center" gap="2" h="26px" px="2">
        <Lamp color="faint" />
        <Text fontSize="xs" color="engrave">
          Off air
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      align="center"
      gap="2.5"
      h="26px"
      pl="2"
      pr="2.5"
      rounded="xs"
      bg="tallyTint"
    >
      <Lamp color="tally" glow />
      <Text fontSize="xs" fontWeight="medium" color="tally">
        On air
      </Text>
      <Box w="1px" h="12px" bg="tally" opacity={0.3} />
      <Text className="mono" fontSize="2xs" color="text">
        {uptime(state.startedAt, now)}
      </Text>
      {state.viewers > 0 && (
        <>
          <Box w="1px" h="12px" bg="tally" opacity={0.3} />
          <Text fontSize="2xs" color="engrave">
            <Box as="span" className="mono" color="text">
              {state.viewers.toLocaleString()}
            </Box>{" "}
            watching
          </Text>
        </>
      )}
    </Flex>
  );
}

function Lamp({ color, glow = false }: { color: string; glow?: boolean }) {
  return (
    <Box
      className={glow ? "tally-lamp" : undefined}
      w="7px"
      h="7px"
      rounded="full"
      bg={color}
      boxShadow={glow ? "glowTally" : undefined}
      flexShrink={0}
    />
  );
}
