"use client";

import { useState, useEffect, useRef } from "react";
import type { SearchItem } from "@/types/SearchItem";
import Image from "next/image";
import { formatMin } from "@/lib/utils";
import { Search } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

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
          setError("Search failed");
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
      const res = await fetch(`${API_BASE_URL}/api/player/enqueue`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, requester: "web" }),
      });
      const data: { error?: string } = await res.json();
      if (data?.error) throw new Error(data.error);
      onClose?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add track");
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 max-h-[80vh]">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search on YouTube…"
            className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg3)] pl-12 pr-4 text-sm outline-none focus:border-[var(--color-highlight)] transition-colors placeholder:text-[var(--color-muted)]"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-[var(--color-muted)]">Searching…</div>
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {!loading && !error && query.trim() && results.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-[var(--color-muted)]">No results found</div>
        </div>
      )}

      {!query.trim() && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-[var(--color-muted)]">Start typing to search for music</div>
        </div>
      )}

      <ul className="flex flex-col gap-2 overflow-y-auto scrollbar pr-2">
        {results.map((r) => (
          <li
            key={r.id}
            className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg3)] hover:border-[var(--color-highlight)] transition-colors"
          >
            <button
              className="flex w-full items-center gap-4 p-3 text-left hover:bg-[var(--color-bg2)] transition-colors"
              onClick={() => enqueueVideo(r.id)}
              title="Add to queue"
            >
              {r.thumb && (
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={r.thumb}
                    alt={r.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--color-text)]">{r.title}</div>
                <div className="truncate text-xs text-[var(--color-muted)] mt-1">
                  {r.channel}
                  {r.durationSec && (
                    <span className="ml-2">• {formatMin(r.durationSec)}</span>
                  )}
                </div>
              </div>
              <span className="flex-shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] group-hover:border-[var(--color-highlight)] group-hover:bg-[var(--color-highlight)]/10 transition-colors">
                Add
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
