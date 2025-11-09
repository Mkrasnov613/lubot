"use client";

import type { Track } from "@/types/musicPlayer";
import { showToast } from "@/lib/toast";
import { useMemo, useRef, useState, useEffect } from "react";
import { formatTime } from "@/lib/utils";
import Image from "next/image";

type YouTubePlayer = {
  getIframe?: () => HTMLIFrameElement | null;
  loadVideoById?: (opts: { videoId: string; startSeconds?: number }) => void;
  cueVideoById: (opts: { videoId: string; startSeconds?: number }) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  isMuted?: () => boolean;
  mute?: () => void;
  unMute?: () => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
};

type YouTubePlayerEvent = { data?: number; target: YouTubePlayer };
type YouTubeNamespace = {
  Player: new (
    element: HTMLElement | string,
    options: {
      height?: string;
      width?: string;
      playerVars?: Record<string, unknown>;
      events?: {
        onReady?: (event: YouTubePlayerEvent) => void;
        onStateChange?: (event: YouTubePlayerEvent) => void;
        onError?: (event: { data?: number }) => void;
      };
    }
  ) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number };
};

type YouTubeWindow = Window & {
  YT?: YouTubeNamespace;
  onYouTubeIframeAPIReady?: () => void;
};

const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const safeId = (id?: string | null) => {
  const v = (id || "").trim();
  return YT_ID_RE.test(v) ? v : null;
};

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
  const playerRef = useRef<YouTubePlayer | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);
  const pendingIdRef = useRef<string | null>(null);

  // local state from iframe
  const [localPos, setLocalPos] = useState(0);
  const [localDur, setLocalDur] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const progress = useMemo(() => {
    const dur = localDur || durationSec || track?.durationSec || 0;
    const pos = localPos || positionSec || 0;
    return dur ? Math.min(100, Math.max(0, (pos / dur) * 100)) : 0;
  }, [localPos, localDur, positionSec, durationSec, track?.durationSec]);

  // Load Iframe API once
  useEffect(() => {
    const w = window as YouTubeWindow;
    if (w.YT?.Player) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  // Create player
  useEffect(() => {
    const w = window as YouTubeWindow;
    if (!mountRef.current) return;

    const create = () => {
      if (playerRef.current || !mountRef.current || !w.YT) return;

      playerRef.current = new w.YT.Player(mountRef.current, {
        height: "0",
        width: "0",
        playerVars: {
          autoplay: 1, // we will mute first to satisfy policy
          controls: 0,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            readyRef.current = true;

            // Allow autoplay by muting first
            try {
              e.target.mute?.();
            } catch {}

            // duration may be 0 if nothing is loaded yet
            setLocalDur(e.target.getDuration?.() || track?.durationSec || 0);

            // If a track waited for readiness, load & start it muted
            if (pendingIdRef.current) {
              try {
                playerRef.current?.loadVideoById?.({
                  videoId: pendingIdRef.current,
                  startSeconds: 0,
                });
              } catch {}
              pendingIdRef.current = null;
            }
          },
          onStateChange: (e) => {
            const YT = w.YT;
            if (!YT) return;
            console.log("[YT] state:", e?.data);
            setSpinning(e.data === YT.PlayerState.PLAYING);

            if (e.data === YT.PlayerState.ENDED) {
              // Move to next track (see CORS notes below)
              fetch("http://localhost:3000/api/player/next", {
                method: "POST",
                headers: { "x-player-secret": "lutikmojlubimyj" },
              }).catch(() => {});
            }
          },
          onError: (e) => {
            // 2=invalid param (usually bad videoId), 5/100/101/150=playback restrictions
            console.error("[YT] error code:", e?.data);
          },
        },
      });

      // enable autoplay explicitly on iframe
      try {
        playerRef.current
          .getIframe?.()
          ?.setAttribute("allow", "autoplay; encrypted-media");
      } catch {}
    };

    if (w.YT?.Player) {
      create();
    } else {
      (window as YouTubeWindow).onYouTubeIframeAPIReady = create;
    }
  }, []);

  // When track changes, load video
  useEffect(() => {
    const id = safeId(track?.id);
    if (!id) return;

    if (playerRef.current && readyRef.current) {
      try {
        // load (not cue) to actually start (muted)
        playerRef.current.loadVideoById?.({ videoId: id, startSeconds: 0 });
        playerRef.current.unMute();
      } catch {}
    } else {
      pendingIdRef.current = id;
    }
  }, [track?.id]);

  // Poll progress from iframe
  useEffect(() => {
    const tick = () => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const t = p.getCurrentTime?.() || 0;
        const d = p.getDuration?.() || 0;
        setLocalPos(Math.max(0, Math.floor(t)));
        setLocalDur(d);
      } catch {}
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Sync external "isPlaying" without unmuting (autoplay policy)
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;
    try {
      if (isPlaying) p.playVideo();
      else p.pauseVideo();
    } catch {}
  }, [isPlaying]);

  function togglePlay() {
    const p = playerRef.current;
    if (!p) return;
    try {
      const state = (window as YouTubeWindow).YT?.PlayerState;
      const s = p.getPlayerState();
      if (s === state?.PLAYING) {
        p.pauseVideo();
      } else {
        p.unMute?.();
        p.playVideo();
      }
    } catch {}
  }

  async function nextTrack() {
    try {
      await fetch("http://localhost:3000/api/player/next", {
        method: "POST",
        headers: { "x-player-secret": "lutikmojlubimyj" },
      });
    } catch {}
  }

  return (
    <div className="p-3 md:p-4">
      <div className="flex items-center gap-4">
        {/* Artwork / vinyl */}
        {track && (
          <div className="relative h-16 w-16 shadow-2xl">
            <Image
              src={track.thumb}
              alt={track.title}
              fill
              sizes="64px" // <-- fix Next/Image warning
              className="z-10 object-cover"
            />
            <button
              onClick={togglePlay}
              title="Play/Pause"
              className={`absolute left-1/2 bottom-1/2 z-5 h-14 w-14 translate-y-1/2 shrink-0 rounded-full border border-[var(--color-border)]
                bg-[radial-gradient(circle_at_30%_30%,hsl(227_76%_78%/.12),transparent_40%),conic-gradient(from_0deg,transparent_0_92%,hsl(232_52%_24%)_92%_100%)]
                ${spinning ? "animate-spin-slow" : ""}`}
            >
              <div className="absolute inset-3 rounded-full border border-[var(--color-border)] bg-[var(--color-bg2)]" />
              <div className="absolute inset-[38%] rounded-full bg-[var(--color-bg1)]" />
            </button>
          </div>
        )}

        <div className="min-w-0 flex-1 pl-5">
          <div className="truncate text-sm font-medium">
            {track ? track.title : "Нічого не відтворюється"}
          </div>
          <div className="truncate text-xs text-[var(--color-muted)]">
            {track
              ? `${track.author?.name ?? "—"} • @${track.requester ?? ""} ${
                  track.id ?? "no id"
                }`
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
          className="range block h-2 w-full cursor-default appearance-none rounded-full bg-[var(--color-bg3)] outline-none
                     [::-webkit-slider-thumb]:h-3 [::-webkit-slider-thumb]:w-3 [::-webkit-slider-thumb]:appearance-none
                     [::-webkit-slider-thumb]:rounded-full [::-webkit-slider-thumb]:bg-[var(--color-highlight)]"
        />
      </div>
    </div>
  );
}
