"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { Button, Badge, Box, Flex } from "@chakra-ui/react";

type BotStatus = "connected" | "disconnected";

export default function BotConnectionWindow() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bot/status`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && data.success) setStatus(data.status);
      } catch (e) {
        console.error("bot status fetch failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleBot() {
    if (!status || toggling) return;
    const action = status === "connected" ? "disable" : "enable";

    setToggling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bot/${action}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setStatus(data.status);
    } catch (e) {
      console.error("bot toggle failed:", e);
    } finally {
      setToggling(false);
    }
  }

  const isConnected = status === "connected";

  return (
    <Box borderWidth="1px" borderColor="border" bg="surface" rounded="lg" p="4" spaceY="4">
      <Flex align="center" gap="3">
        <Box rounded="full" p="2" bg={isConnected ? "onlineSubtle" : "surface2"} color={isConnected ? "online" : "textMuted"}>
          <Bot />
        </Box>
        <Box>
          <Flex fontWeight="semibold" align="center" gap="2">
            LuBot is {loading ? "checking status…" : isConnected ? "connected" : "disconnected"}
            {!loading && <Badge tone={isConnected ? "online" : "neutral"}>{isConnected ? "live" : "offline"}</Badge>}
          </Flex>
          <Box color="textMuted" fontSize="sm">
            Use commands like{" "}
            <Box as="span" fontFamily="mono" bg="surface2" px="1" rounded="sm">!sr</Box>,{" "}
            <Box as="span" fontFamily="mono" bg="surface2" px="1" rounded="sm">!song</Box>, and{" "}
            <Box as="span" fontFamily="mono" bg="surface2" px="1" rounded="sm">!queue</Box>.
          </Box>
        </Box>
      </Flex>

      <Button
        onClick={toggleBot}
        disabled={loading || toggling || status === null}
        variant={isConnected ? "secondary" : "twitch"}
      >
        {toggling && <Loader2 className="animate-spin" size={16} />}
        {isConnected ? "Disconnect bot" : "Connect bot"}
      </Button>
    </Box>
  );
}
