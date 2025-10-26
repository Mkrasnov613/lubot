import { NextResponse } from "next/server";
import ytSearch from "yt-search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) return NextResponse.json({ items: [] });
  const result = await ytSearch(q);

  const items = (result.videos || [])
    .filter((v: any) => v.videoId && !v.live && !v.isShorts)
    .slice(0, 5)
    .map((v: any) => ({
      id: v.videoId,
      title: v.title,
      durationSec: v.seconds,
      thumb: v.thumbnail,
      url: v.url,
      channel: v.author?.name,
    }));

  return NextResponse.json({ items }, { status: 200 });
}
