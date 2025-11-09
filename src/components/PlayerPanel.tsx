"use client";

import { Track } from "@/types/musicPlayer";
import PlayerBar from "./PlayerBar";
import { useRef, useEffect } from "react";
import { showToast } from "@/lib/toast";
import QueueCard from "./QueueCard";
import { useQueue } from "@/hooks/useQueue";
import Image from "next/image";

export default function PlayerPanel() {
  const { queue, nowPlaying, isPlaying, positionSec, durationSec } = useQueue();

  const prevIdsRef = useRef<string[] | null>(null)

  useEffect(() => {
    const currIds = queue.map((t) => t.id);

    if (prevIdsRef.current) {
      const prevIds = prevIdsRef.current;

      const addedIds = currIds.filter((id) => !prevIds.includes(id));

      if (addedIds.length > 0) {
        const addedTracks = queue.filter((t) => addedIds.includes(t.id));

        if (addedTracks.length === 1) {
          const t = addedTracks[0];
          showToast({
            title: "Track was added to the queue",
            description: `${t.title} — ${t.author?.name ?? "Unknown author"}`,
            status: "success",
          });
        } else {
          showToast({
            title: "Tracks were added to the queue",
            description: `${addedTracks.length} new tracks`,
            status: "success",
          });
        }
      }
    }

    prevIdsRef.current = currIds;
  }, [queue]);

  return (
    <div className="flex min-h-[640px] flex-col gap-4 rounded-3xl border border-[var(--color-border)] border-t-highlight p-4 md:p-6 bg-bg2">
      {/* PLAYER */}
      <PlayerBar
        track={nowPlaying || null}
        isPlaying={isPlaying}
        positionSec={positionSec}
        durationSec={durationSec}
      />

      {/* QUEUE */}
      <div className="relative mt-2 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] border-t-highlight bg-gradient-to-b from-bg3 to-bg2">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Черга
          </h3>
          <span className="text-xs text-[var(--color-muted)]">
            {queue.length}
          </span>
        </div>
        {queue.length === 0 && (
          <>
            <div className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
              Черга порожня. Додайте треки зліва.
            </div>
            <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2">
              <Image
                src="/lutik-queue2.webp"
                width={300}
                height={100}
                alt="зображення кота"
              />
            </div>
          </>
        )}
        <ul className="max-h-[56vh] space-y-2 overflow-y-auto p-2">
          {queue.map((t: Track) => (
            <QueueCard key={t.id} track={t} />
          ))}
        </ul>
      </div>
    </div>
  );
}
