"use client";

import { useQueue } from "@/hooks/useQueue";
import Image from "next/image";

export default function QueuePanel() {
  const { queue, nowPlaying } = useQueue();

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg3)] p-4">
      {/* Now playing */}
      <div>
        <h4 className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
          Зараз грає
        </h4>
        <div className="mt-1 truncate text-sm font-medium">
          {nowPlaying ? nowPlaying.title : "— черга порожня"}
        </div>
      </div>

      {/* Queue header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Черга</h4>
        <span className="text-xs text-[var(--color-muted)]">
          {queue.length} трек{queue.length === 1 ? "" : "ів"}
        </span>
      </div>

      {/* Queue list */}
      <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
        {queue.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-2xl bg-[var(--color-bg2)]/90 p-2"
          >
            {t.thumb && (
              <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                <Image
                  src={t.thumb}
                  alt={t.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{t.title}</div>
              <div className="truncate text-[10px] text-[var(--color-muted)]">
                {t.author?.name ?? "Unknown"} • @{t.requester}
              </div>
            </div>
          </li>
        ))}

        {queue.length === 0 && (
          <li className="text-xs text-[var(--color-muted)]">
            Додайте перший трек через пошук.
          </li>
        )}
      </ul>
    </div>
  );
}