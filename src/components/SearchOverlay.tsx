"use client";

import { useState, useEffect, useRef } from "react";
import type { SearchItem } from "@/types/SearchItem";
import Image from "next/image";
import { formatMin } from "@/lib/utils";

export default function SearchOverlay({ onClose }: { onClose?: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      abortRef.current?.abort();
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        setError(null);
        const r = await fetch(`/api/search?q=${query}`, {
          signal: ac.signal,
        });
        const data: { items?: SearchItem[] } = await r.json();
        setResults(data.items || []);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Пошук не вдався");
        }
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(t);
  }, [query]);

  async function enqueueVideo(videoId: string) {
    try {
      const res = await fetch(`/api/enqueue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, requester: "web" }),
      });
      const data: { error?: string } = await res.json();
      if (data?.error) throw new Error(data.error);
      onClose?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Не вдалося додати трек");
      } else {
        setError("Не вдалося додати трек");
      }
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук на YouTube…"
          className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg3)] px-4 text-sm outline-none placeholder:text-[var(--color-muted)]"
        />
        <button
          onClick={onClose}
          className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg3)] px-4 text-sm"
        >
          Закрити
        </button>
      </div>

      {loading && (
        <div className="px-1 text-sm text-[var(--color-muted)]">Шукаю…</div>
      )}
      {error && (
        <div className="px-1 text-sm text-[var(--danger)]">{error}</div>
      )}

      <ul className="grid gap-2">
        {results.map((r) => (
          <li
            key={r.id}
            className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg3)]"
          >
            <button
              className="flex w-full items-center gap-4 p-2 text-left hover:bg-[var(--color-bg2)]"
              onClick={() => enqueueVideo(r.id)}
              title="Додати у чергу"
            >
              {r.thumb && (
                <div className="relative h-24 w-24 overflow-hidden rounded-xl">
                  <Image
                    src={r.thumb}
                    alt="thumb"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.title}</div>
                <div className="truncate text-xs text-[var(--color-muted)]">
                  {r.channel}{" "}
                  {r.durationSec ? ` • ${formatMin(r.durationSec)}` : ""}
                </div>
              </div>
              <span className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)]">
                Додати
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
