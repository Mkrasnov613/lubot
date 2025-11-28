export type Track = {
  id: string;
  title: string;
  thumb: string;
  durationSec?: number;
  requester?: string;
  author?: { name?: string };
};

export type QueueUpdate = {
  queue: Track[];
  nowPlaying: Track | null;
};
