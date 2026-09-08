import TwitchPlayer from "./TwitchPlayer";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import EditStreamMeta from "./EditStreamMeta";
import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex, Text } from "@chakra-ui/react";
import Panel from "@/components/Panel";

export default async function TwitchChannelComponent({
  slug,
}: {
  slug: string;
}) {
  const cookieHeader = (await cookies()).toString();

  const channelRes = await fetch(`${API_BASE_URL}/api/twitch/channel`, {
    cache: "no-cache",
    headers: { cookie: cookieHeader },
  });

  // Matches the pattern in ActivityFeedComponent: an expired session is a
  // redirect, not a crash.
  if (channelRes.status === 401) redirect("/");

  const { channel } = await channelRes.json();

  // initial game art render
  const artRes = await fetch(
    `${API_BASE_URL}/api/twitch/game-art?id=${encodeURIComponent(
      channel?.game_id ?? "",
    )}`,
    {
      cache: "no-cache",
      headers: { cookie: cookieHeader },
    },
  );
  const { boxArtUrl } = await artRes.json();

  async function updateStream(formData: FormData) {
    "use server";

    const title = formData.get("title")?.toString() ?? "";
    const gameId = formData.get("gameId")?.toString() ?? channel?.game_id;

    const cookieHeaderInner = (await cookies()).toString();

    try {
      const res = await fetch(`${API_BASE_URL}/api/twitch/channel/update`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: cookieHeaderInner,
        },
        body: JSON.stringify({ title, gameId }),
        cache: "no-cache",
      });

      const json = await res.json();

      // The route answers { ok: false, message } on a Twitch rejection, and
      // that used to be reported as success because only throws were caught.
      if (!res.ok || json?.ok === false) {
        return {
          ok: false as const,
          message: json?.message || `Twitch rejected the update (${res.status})`,
        };
      }

      return { ok: true as const, message: json.message || "Updated" };
    } catch (e: unknown) {
      return {
        ok: false as const,
        message: e instanceof Error ? e.message : "Network error",
      };
    } finally {
      revalidatePath(`/dashboard/${slug}`);
    }
  }

  return (
    <Panel label="Broadcast" flush>
      <Suspense fallback={<Box w="100%" aspectRatio="16 / 9" maxH="46vh" bg="video" />}>
        <TwitchPlayer slug={slug} />
      </Suspense>

      {/* The meta strip is set into the panel below the player — box art acts
          as the anchor, the way a channel strip is labelled by its source. */}
      <Flex
        gap="3"
        p="var(--panel-pad)"
        borderTopWidth="1px"
        borderColor="seam"
        align="flex-start"
      >
        {boxArtUrl ? (
          <Image
            src={boxArtUrl}
            width={144}
            height={192}
            alt=""
            style={{
              width: "54px",
              height: "72px",
              borderRadius: "var(--radius-xs)",
              flexShrink: 0,
            }}
          />
        ) : (
          <Box w="54px" h="72px" rounded="xs" bg="inset" flexShrink={0} />
        )}

        <Box minW="0" flex="1">
          <Text fontSize="lg" fontWeight="semibold" truncate>
            {channel?.broadcaster_name ?? slug}
          </Text>
          <EditStreamMeta
            initialTitle={channel?.title ?? ""}
            initialGame={channel?.game_name ?? ""}
            updateStream={updateStream}
          />
        </Box>
      </Flex>
    </Panel>
  );
}
