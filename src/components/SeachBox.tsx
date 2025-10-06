"use client";

import { useState, useEffect, useRef } from "react";
import type { SearchItem } from "@/types/SearchItem";

export default function SearchBox() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      abortRef.current?.abort();
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const t = setTimeout(async () => {
      abortRef.current?.abort(); // cancel previous
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        setLoading(true);
        setError(null);

        const base = "http://localhost:3000";
        const r = await fetch(
          `${base}/api/search?q=${encodeURIComponent(query)}`,
          {
            signal: ac.signal,
          }
        );
        const data = await r.json();
        setResults(data.items);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError("Search failed");
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search YouTube…"
        className="border rounded px-3 py-2 w-full"
      />

      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <ul className="space-y-2">
        {results.map((r) => (
          <li key={r.id} className="flex items-start gap-3">
            {r.thumb && (
              <img
                src={r.thumb}
                alt=""
                width={120}
                height={68}
                className="rounded object-cover"
              />
            )}
            <div className="min-w-0">
              <div className="font-medium truncate">{r.title}</div>
              <div className="text-sm opacity-70">
                {r.channel}{" "}
                {r.durationSec ? `• ${Math.round(r.durationSec / 60)} min` : ""}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
