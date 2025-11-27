import { useEffect, useState } from "react";
import getSocket from "@/lib/socket";
import type { QueueUpdate, Track } from "@/types/musicPlayer";

export function useQueue() {
  const [queue, setQueue] = useState<Track[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSec, setPosition] = useState(0);
  const [durationSec, setDuration] = useState(0);

  useEffect(() => {
    const server = getSocket();

    const onQueueUpdate = ({ queue, nowPlaying }: QueueUpdate) => {
      setQueue(queue);
      setNowPlaying(nowPlaying || null);
      setIsPlaying(Boolean(nowPlaying)); 
      if (nowPlaying?.durationSec) setDuration(nowPlaying.durationSec);
    };

    const onPlayerPlay = ({ track }: { track: Track | null }) => {
      setNowPlaying(track || null);
      setIsPlaying(Boolean(track));
      if (track?.durationSec) setDuration(track.durationSec);
    };

    const onPlayerPause = () => setIsPlaying(false);

    // Optional progress event from server
    const onPlayerProgress = ({
      positionSec,
      durationSec,
    }: {
      positionSec: number;
      durationSec?: number;
    }) => {
      setPosition(positionSec || 0);
      if (durationSec) setDuration(durationSec);
    };

    server.on("queue:update", onQueueUpdate);
    server.on("player:play", onPlayerPlay);
    server.on("player:pause", onPlayerPause);
    server.on("player:progress", onPlayerProgress);

    return () => {
      server.off("queue:update", onQueueUpdate);
      server.off("player:play", onPlayerPlay);
      server.off("player:pause", onPlayerPause);
      server.off("player:progress", onPlayerProgress);
    };
  }, []);

  // Fallback local progress timer if server doesn't emit progress
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setPosition((p) => {
        const next = p + 1;
        return durationSec ? Math.min(next, durationSec) : next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, durationSec]);

  return { queue, nowPlaying, isPlaying, positionSec, durationSec };
}
