import TwitchPlayer from "./TwitchPlayer";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Image from "next/image";
import EditStreamMeta from "./EditStreamMeta";
import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex } from "@chakra-ui/react";

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
    <Flex
      as="article"
      className="shadow-large"
      direction="column"
      gap="5"
      minH="400px"
      minW="520px"
      p="5"
      bgGradient="to-b"
      gradientFrom="surface2"
      gradientTo="surface"
      borderWidth="1px"
      borderColor="border"
      borderTopColor="highlight"
      rounded="2xl"
      alignSelf="flex-start"
    >
      <Box display="flex" alignItems="center">
        <Suspense fallback={""}>
          <TwitchPlayer slug={slug} />
        </Suspense>
      </Box>
      <Flex gap="5" fontWeight="semibold" justify="flex-start" align="center" color="text">
        {boxArtUrl ? (
          <Image src={boxArtUrl} width={300} height={300} alt="" style={{ width: "70px", height: "93px" }} />
        ) : (
          <Box w="85px" h="85px" rounded="md" bg="surface2" />
        )}

        <Box display="flex" flexDir="column">
          <Box fontSize="2xl">{channel?.broadcaster_name}</Box>
          <EditStreamMeta
            initialTitle={channel?.title ?? ""}
            initialGame={channel?.game_name ?? ""}
            updateStream={updateStream}
          />
        </Box>
      </Flex>
    </Flex>
  );
}
