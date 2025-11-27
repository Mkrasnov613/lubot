import Image from "next/image";
import type { Track } from "@/types/musicPlayer";

export default function QueueCard({ track }: { track: Track }) {
  return (
    <li className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] border-t-highlight bg-gradient-to-b from-bg3 to-bg2">
      {/* Square cover */}
      <div className="relative h-16 w-16 overflow-hidden rounded-l-xl">
        <Image src={track.thumb} alt={track.title} fill className="object-cover" />
      </div>

      {/* Title + Author */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{track.title}</div>
        <div className="truncate text-[13px] text-[var(--color-muted)]">
          {track.author?.name ?? "—"}
        </div>
      </div>

      {/* @requester at the far right */}
      <div className="whitespace-nowrap text-xs text-[var(--color-muted)] mr-5">@{track.requester}</div>
    </li>
  );
}