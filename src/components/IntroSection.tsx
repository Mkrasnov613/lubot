"use client"

import { useState } from "react";
import Image from "next/image";
import SearchOverlay from "./SearchOverlay";

export default function IntroSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative overflow-hidden p-6 md:p-8">
      {/* BACK LAYER */}
      <div className="pointer-events-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Музичний бот
          </h1>
          <p className="max-w-prose text-sm text-[var(--color-muted)]">
            Шукайте треки через <span className="font-medium">ytsearch</span> і
            додавайте їх у чергу. Керування програвачем – праворуч.
          </p>
        </div>

        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg3)]">
          
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg3)] px-5 py-3 text-sm font-medium shadow hover:bg-[var(--color-bg2)] focus:outline-none"
        >
          {open ? "Сховати пошук" : "Знайти та додати трек"}
        </button>
      </div>

      {/* FRONT LAYER (DROPDOWN) */}
      {open && (
        <div className="absolute inset-x-0 top-0 z-20 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg2)]/98 shadow-2xl">
          <SearchOverlay onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Decorative gradient */}
      <div className="pointer-events-none absolute -inset-10 -z-10 bg-[radial-gradient(60%_60%_at_20%_10%,hsl(228_33%_46%/.35),transparent_60%)]" />
    </div>
  );
}
