"use client";

import type { Track } from "@/types/musicPlayer";
import { useMemo, useRef, useState, useEffect } from "react";
import { formatTime } from "@/lib/utils";
import Image from "next/image";

export default function PlayerBar({
  track,
  isPlaying,
  positionSec,
  durationSec,
}: {
  track: Track | null;
  isPlaying: boolean;
  positionSec: number;
  durationSec: number;
}) {
  const playerRef = useRef<any>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Local progress derived from iframe player
  const [localPos, setLocalPos] = useState(0);
  const [localDur, setLocalDur] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const progress = useMemo(() => {
    const dur = localDur || durationSec || track?.durationSec || 0;
    const pos = localPos || positionSec || 0;
    if (!dur) return 0;
    return Math.min(100, Math.max(0, (pos / dur) * 100));
  }, [localPos, localDur, positionSec, durationSec, track?.durationSec]);

  useEffect(() => {
    const w = window as any;
    if (w.YT && w.YT.Player) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  useEffect(() => {
    const w = window as any;
    if (!mountRef.current) return;

    function create() {
      if (playerRef.current || !mountRef.current) return;
      playerRef.current = new w.YT.Player(mountRef.current, {
        height: "0",
        width: "0",
        videoId: track?.id || undefined,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (e: any) => {
            setLocalDur(e.target.getDuration?.() || track?.durationSec || 0);
            if (track?.id) e.target.loadVideoById(track.id, 0, "small");
          },
          onStateChange: (e: any) => {
            const YT = w.YT;
            if (e.data === YT.PlayerState.PLAYING) {
              setSpinning(true);
            } else {
              setSpinning(false);
            }
            if (e.data === YT.PlayerState.ENDED) {
              fetch("http://localhost:3000/api/next", {
                method: "POST",
                headers: {
                  "x-player-secret": "lutikmojlubimyj",
                },
              }).catch(() => {});
            }
          },
        },
      });
    }

    if (w.YT && w.YT.Player) {
      create();
    } else {
      (window as any).onYouTubeIframeAPIReady = () => create();
    }

    return () => {
      // keep player for reuse between renders
    };
  }, [track?.id]);

  // Load new video when track changes
  useEffect(() => {
    const p = playerRef.current;
    if (p && track?.id) {
      try {
        p.loadVideoById(track.id, 0, "small");
      } catch {}
    }
  }, [track?.id]);

  // Poll progress if playing
  useEffect(() => {
    const p = playerRef.current;
    let id: any;
    function tick() {
      if (!p) return;
      try {
        const t = p.getCurrentTime?.() || 0;
        const d = p.getDuration?.() || 0;
        setLocalPos(Math.max(0, Math.floor(t)));
        setLocalDur(d);
      } catch {}
    }
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function togglePlay() {
    const p = playerRef.current;
    if (!p) return;
    try {
      const state = (window as any).YT?.PlayerState;
      const s = p.getPlayerState?.();
      if (s === state?.PLAYING) p.pauseVideo?.();
      else p.playVideo?.();
    } catch {}
  }

  async function nextTrack() {
    try {
      await fetch("http://localhost:3000/api/next", {
        method: "POST",
        headers: {
          "x-player-secret": "lutikmojlubimyj",
        },
      });
    } catch (e) {}
  }

  return (
    <div className="p-3 md:p-4">
      <div className="flex items-center gap-4">
        {/* VINYL DISC */}
        {track && (
          <div className="relative h-16 w-16 shadow-2xl">
            <Image
              src={track.thumb}
              alt={track.title}
              fill
              className="object-cover z-10"
            />
            <button
              onClick={togglePlay}
              className={`absolute h-14 w-14 shrink-0 rounded-full border border-[var(--color-border)] left-1/2 bottom-1/2 translate-y-1/2 z-5
                bg-[radial-gradient(circle_at_30%_30%,hsl(227_76%_78%/.12),transparent_40%),conic-gradient(from_0deg,transparent_0_92%,hsl(232_52%_24%)_92%_100%)] ${
                  spinning ? " animate-spin-slow" : ""
                }`}
              title="Play/Pause"
            >
              <div className="absolute inset-3 rounded-full border border-[var(--color-border)] bg-[var(--color-bg2)]" />
              <div className="absolute inset-[38%] rounded-full bg-[var(--color-bg1)]" />
            </button>
          </div>
        )}

        <div className="pl-5 min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {track ? track.title : "Нічого не відтворюється"}
          </div>
          <div className="truncate text-xs text-[var(--color-muted)]">
            {track
              ? `${track.author?.name ?? "—"} • @${track.requester ?? ""}`
              : "—"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={nextTrack}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)] hover:bg-[var(--color-bg2)]"
          >
            Next
          </button>
          <div className="text-right text-xs tabular-nums text-[var(--color-muted)]">
            <span>{formatTime(localPos || positionSec)}</span>
            <span className="mx-1">/</span>
            <span>
              {formatTime(localDur || durationSec || track?.durationSec || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden iframe mount point (0x0) */}
      <div className="h-0 w-0 overflow-hidden">
        <div ref={mountRef} />
      </div>

      {/* Progress */}
      <div className="mt-3">
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          readOnly
          className="range block h-2 w-full cursor-default appearance-none rounded-full bg-[var(--color-bg3)] outline-none [::-webkit-slider-thumb]:appearance-none [::-webkit-slider-thumb]:h-3 [::-webkit-slider-thumb]:w-3 [::-webkit-slider-thumb]:rounded-full [::-webkit-slider-thumb]:bg-[var(--color-highlight)]"
        />
      </div>
    </div>
  );
}
