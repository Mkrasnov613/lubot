"use client";

import { useQueue } from "@/hooks/useQueue";

export default function QueuePanel() {
  const { queue, nowPlaying } = useQueue();

  return (
    <div>
      <h4>Now Playing</h4>
      <div>{nowPlaying ? nowPlaying.title : "—"}</div>

      <h4>Queue ({queue.length})</h4>
      <ul>
        {queue.map((t) => (
          <li key={t.id}>
            {t.title} — @{t.requester}
          </li>
        ))}
      </ul>
    </div>
  );
}
