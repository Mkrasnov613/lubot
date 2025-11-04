import TwitchChat from "./TwitchChat";
import TwitchPlayer from "./TwitchPlayer";
import { cookies } from "next/headers";
import Image from "next/image";
import EditStreamMeta from "./EditStreamMeta";
import { revalidatePath } from "next/cache";

export default async function TwitchChannelComponent({
  slug,
}: {
  slug: string;
}) {
  const cookieHeader = (await cookies()).toString();

  const channelRes = await fetch("http://localhost:3000/api/twitch/channel", {
    cache: "no-cache",
    headers: { cookie: cookieHeader },
  });
  const { channel } = await channelRes.json();

  // initial game art render
  const artRes = await fetch(
    `http://localhost:3000/api/twitch/game-art?id=${encodeURIComponent(
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
        "http://localhost:3000/api/twitch/channel/update",
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
    } catch (e: any) {
      return { ok: false as const, message: e?.message || "Network error" };
    } finally {
      revalidatePath(`/dashboard/${slug}`);
    }
  }

  return (
    <article className="flex flex-col gap-5 min-h-[510px] max-w-[1050px] p-5 shadow-large bg-gradient-to-b from-bg3 to-bg2 border-1 border-border border-t-highlight rounded-2xl self-end">
      <div className="flex items-center">
        <TwitchPlayer slug={slug} />
        <TwitchChat slug={slug} />
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
