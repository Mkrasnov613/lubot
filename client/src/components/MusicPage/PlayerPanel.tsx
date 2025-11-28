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

  const prevIdsRef = useRef<string[] | null>(null);

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
    <div className="flex items-center justify-center gap-4 rounded-3xl">
      {/* PLAYER */}
      <PlayerBar
        track={nowPlaying || null}
        isPlaying={isPlaying}
        positionSec={positionSec}
        durationSec={durationSec}
      />
    </div>
  );
}
