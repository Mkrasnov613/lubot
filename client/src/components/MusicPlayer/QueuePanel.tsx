"use client";

import { Track } from "@/types/musicPlayer";
import Image from "next/image";
import { useQueue } from "@/hooks/useQueue";

type QueuePanelProps = {
  initialQueue?: Track[];
  initialNowPlaying?: Track | null;
  tenantId: string | null;
};

export default function QueuePanel({ 
  initialQueue = [],
  initialNowPlaying = null, 
  tenantId 
}: QueuePanelProps) {
  const { queue, nowPlaying } = useQueue(initialQueue, initialNowPlaying, tenantId);

  return (
    <div className="flex flex-col gap-5">
      {/* Now playing */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-medium">
          Now Playing
        </h4>
        {nowPlaying ? (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg3)] p-3">
            {nowPlaying.thumb && (
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={nowPlaying.thumb}
                  alt={nowPlaying.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--color-text)]">
                {nowPlaying.title}
              </div>
              <div className="truncate text-xs text-[var(--color-muted)] mt-1">
                {nowPlaying.author?.name ?? "Unknown"}
                {nowPlaying.requester && (
                  <span className="ml-2">• @{nowPlaying.requester}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-bg3)]/50 p-4 text-center">
            <div className="text-sm text-[var(--color-muted)]">
              No track playing
            </div>
          </div>
        )}
      </div>

      {/* Queue header */}
      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <h4 className="text-sm font-semibold text-[var(--color-text)]">Queue</h4>
        <span className="text-xs text-[var(--color-muted)] bg-[var(--color-bg3)] px-2 py-1 rounded-full">
          {queue.length} {queue.length === 1 ? "track" : "tracks"}
        </span>
      </div>

      {/* Queue list */}
      <ul className="flex flex-col gap-2 overflow-y-auto scrollbar pr-2 max-h-[50vh]">
        {queue.length > 0 ? (
          queue.map((t, index) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg3)] p-3 hover:border-[var(--color-highlight)] transition-colors"
            >
              <div className="flex-shrink-0 w-6 text-xs text-[var(--color-muted)] font-medium">
                {index + 1}
              </div>
              {t.thumb && (
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={t.thumb}
                    alt={t.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--color-text)]">
                  {t.title}
                </div>
                <div className="truncate text-xs text-[var(--color-muted)] mt-0.5">
                  {t.author?.name ?? "Unknown"}
                  {t.requester && (
                    <span className="ml-2">• @{t.requester}</span>
                  )}
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="text-center py-8 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-bg3)]/50">
            <div className="text-sm text-[var(--color-muted)]">
              Queue is empty
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">
              Add tracks using the search button
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}
