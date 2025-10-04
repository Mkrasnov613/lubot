import { useEffect, useState } from "react";
import getSocket from "@/lib/socket";
import type { QueueUpdate, Track } from "@/types/musicPlayer";

export function useQueue() {
  const [queue, setQueue] = useState<Track[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Track | null>();

  useEffect(() => {
    const server = getSocket();

    const onQueueUpdate = ({ queue, nowPlaying }: QueueUpdate) => {
      setQueue((q) => (q = queue));
      setNowPlaying((t) => (t = nowPlaying));
    };

    const onPlayerPlay = ({ track }: { track: Track | null }) => {
      setNowPlaying((t) => (t = nowPlaying));
    };

    server.on("queue:update", onQueueUpdate);
    server.on("player:play", onPlayerPlay);

    return () => {
      server.off("queue:update", onQueueUpdate);
      server.off("player:play", onPlayerPlay);
    };
  }, []);

  return {queue, nowPlaying};
}
