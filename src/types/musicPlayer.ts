export type Track = {
  id: string;
  videoId: string;
  title: string;
  url: string;
  requester: string;
  durationSec: number;
};

export type QueueUpdate = {
  queue: Track[];
  nowPlaying: Track | null;
};
