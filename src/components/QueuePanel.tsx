"use client";

import { useQueue } from "@/hooks/useQueue";
import Image from "next/image";

export default function QueuePanel() {
  const { queue, nowPlaying } = useQueue();
  return (
    <div className="w-[60%] border-1 border-border rounded-3xl p-3 truncate min-h-[600px] bg-bg2">
      <div className="bg-bg3">
        <h4>Now Playing</h4>
        <div>{nowPlaying ? nowPlaying.title : "—"}</div>
      </div>

      <h4>Queue ({queue.length})</h4>
      <ul>
        {queue.map((t) => (
          <li key={t.id}>
            <Image
                  src={t.thumb}
                  alt="зображення"
                  width={120}
                  height={68}
                  className="rounded object-cover max-w-30"
                />
            {t.title} — @{t.requester}
            {t.author?.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
