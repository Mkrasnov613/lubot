"use client";

import { useState } from "react";
import SearchOverlay from "./SearchOverlay";
import QueuePanel from "./QueuePanel";
import { Activity } from "react";

export default function IntroSection() {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <section className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg2)] p-6 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Музичний бот
          </h1>
          <p className="max-w-prose text-sm text-[var(--color-muted)]">
            Шукайте треки через <span className="font-medium">ytsearch</span> і
            додавайте їх у чергу
          </p>
        </div>

        <button
          onClick={() => setShowSearch((v) => !v)}
          className="self-start rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg3)] px-5 py-3 text-sm font-medium shadow hover:bg-[var(--color-bg2)] transition-colors"
        >
          {showSearch ? "Показати чергу" : "Знайти та додати трек"}
        </button>
      </div>

      {/* CONTENT AREA: QUEUE OR SEARCH */}
      <div className="mt-6">
        {showSearch && (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg3)]/95 shadow-2xl">
            <SearchOverlay onClose={() => setShowSearch(false)} />
          </div>
        )}
        <div className={`${showSearch ? 'hidden' : "block"}`}>
          <QueuePanel />
        </div>
      </div>

      {/* DECORATIVE GRADIENT */}
      <div className="pointer-events-none absolute -inset-10 -z-10 bg-[radial-gradient(60%_60%_at_20%_10%,hsl(228_33%_46%/.35),transparent_60%)]" />
    </section>
  );
}
