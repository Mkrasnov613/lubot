import { NextResponse } from "next/server";
import { ytSearch } from "yt-search";
import type { SearchItem } from "@/types/SearchItem";

type YtSearchVideo = {
  videoId?: string;
  live?: boolean;
  isShorts?: boolean;
  title?: string;
  seconds?: number;
  thumbnail?: string;
  url?: string;
  author?: {
    name?: string;
  };
};

const isYtSearchVideo = (value: unknown): value is Required<
  Pick<YtSearchVideo, "videoId" | "title" | "thumbnail" | "url">
> &
  YtSearchVideo => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.videoId === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.thumbnail === "string" &&
    typeof candidate.url === "string"
  );
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) return NextResponse.json({ items: [] });
  const result = await ytSearch(q);
  const rawVideos = Array.isArray((result as { videos?: unknown }).videos)
    ? ((result as { videos?: unknown }).videos as unknown[])
    : [];

  const items: SearchItem[] = rawVideos
    .filter(isYtSearchVideo)
    .filter((v) => !v.live && !v.isShorts)
    .slice(0, 5)
    .map((v) => ({
      id: v.videoId,
      title: v.title,
      durationSec: v.seconds,
      thumb: v.thumbnail,
      url: v.url,
      channel: v.author?.name,
    }));

  return NextResponse.json({ items }, { status: 200 });
}
