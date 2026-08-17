import PlayerBar from "./PlayerBar";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex, Text } from "@chakra-ui/react";

export default async function PlayerPanel() {
  const cookieHeader = (await cookies()).toString();
  let tenantId: string | null = null;

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/data/tenant?data=tenant_id`,
      {
        headers: { cookie: cookieHeader },
        cache: "no-store",
      }
    );

    if (res.ok) {
      // Try to parse as JSON first, then fall back to text
      const data = await res.json();
      tenantId = data.tenantId || data || null;
    }
  } catch {}

  if (!tenantId) {
    return (
      <Flex
        as="section"
        wrap="wrap"
        justify="space-around"
        gap="5"
        align="center"
        minH="100vh"
        mx="auto"
        maxW="1680px"
        p="10"
        color="text"
        bg="bg"
      >
        <Box w="700px">
          <Text>Unable to load player. Please ensure you are authenticated.</Text>
        </Box>
      </Flex>
    );
  }

  let initialPlayerState = { queue: [], nowPlaying: null };
  try {
    const playerRes = await fetch(`${API_BASE_URL}/api/player/state`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (playerRes.ok) {
      initialPlayerState = await playerRes.json();
    }
  } catch {
    // Silently fail - WebSocket will provide state on connect
  }
  return (
    <Flex align="center" justify="center" gap="4" bg="surface" h="23" rounded="xl" w="100%" mb="5">
      {/* PLAYER */}
      <PlayerBar
        initialQueue={initialPlayerState.queue}
        initialNowPlaying={initialPlayerState.nowPlaying}
        tenantId={tenantId}
      />
    </Flex>
  );
}
