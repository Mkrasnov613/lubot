import TwitchPlayer from "./TwitchPlayer";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Image from "next/image";
import EditStreamMeta from "./EditStreamMeta";
import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "@/lib/config";

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
      channel?.game_id ?? ""
    )}`,
    {
      cache: "no-cache",
      headers: { cookie: cookieHeader },
    }
  );
  const { boxArtUrl } = await artRes.json();

  async function updateStream(formData: FormData) {
    "use server";

    const title = formData.get("title")?.toString() ?? "";
    const gameId = formData.get("gameId")?.toString() ?? channel.game_id;

    const cookieHeaderInner = (await cookies()).toString();

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/twitch/channel/update`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: cookieHeaderInner,
          },
          body: JSON.stringify({ title, gameId }),
          cache: "no-cache",
        }
      );

      const json = await res.json();

      return { ok: true as const, message: json.message || "Updated" };
    } catch (e: unknown) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Network error" };
    } finally {
      revalidatePath(`/dashboard/${slug}`);
    }
  }

  return (
    <article className="flex flex-col gap-5 min-h-[400px] min-w-[520px] p-5 shadow-large bg-gradient-to-b from-bg3 to-5% to-bg2 border-1 border-border border-t-highlight rounded-2xl self-start">
      <div className="flex items-center">
        <Suspense fallback={""}>
          <TwitchPlayer slug={slug} />
        </Suspense>
      </div>
      <div className="flex gap-5 font-semibold justify-start items-center text-text">
        {boxArtUrl ? (
          <Image
            src={boxArtUrl}
            width={300}
            height={300}
            alt=""
            className="w-[70px] h-[93px]"
          />
        ) : (
          <div className="w-[85px] h-[85px] rounded bg-bg3" />
        )}

        <div className="flex flex-col">
          <div className="text-2xl">{channel?.broadcaster_name}</div>
          <EditStreamMeta
            initialTitle={channel?.title ?? ""}
            initialGame={channel?.game_name ?? ""}
            updateStream={updateStream}
          />
        </div>
      </div>
    </article>
  );
}
