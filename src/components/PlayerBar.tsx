"use client";

import type { Track } from "@/types/musicPlayer";
import { useMemo, useRef, useState, useEffect } from "react";
import { formatTime } from "@/lib/utils";
import Image from "next/image";

type YouTubePlayer = {
  getIframe?: () => HTMLIFrameElement | null;
  cueVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  isMuted?: () => boolean;
  unMute?: () => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
};

type YouTubePlayerEvent = {
  data?: number;
  target: YouTubePlayer;
};

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
  PlayerState: {
    ENDED: number;
    PLAYING: number;
  };
};

type YouTubeWindow = Window & {
  YT?: YouTubeNamespace;
  onYouTubeIframeAPIReady?: () => void;
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
  const readyRef = useRef<boolean>(false);
  const pendingIdRef = useRef<string | null>(null);

  // Local track's progress derived from iframe player
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
    const w = window as YouTubeWindow;
    if (w.YT && w.YT.Player) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  useEffect(() => {
    const w = window as YouTubeWindow;
    if (!mountRef.current) return;

    function create() {
      if (playerRef.current || !mountRef.current) return;
      if (!w.YT) return;
      playerRef.current = new w.YT.Player(mountRef.current, {
        height: "0",
        width: "0",
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
          onReady: (e) => {
            readyRef.current = true;
            setLocalDur(e.target.getDuration?.() || track?.durationSec || 0);
            if (pendingIdRef.current) {
              try {
                e.target.cueVideoById({
                  videoId: pendingIdRef.current,
                  startSeconds: 0,
                });
                e.target.playVideo();
              } catch {
                // ignore cue errors and wait for the next attempt
              }
              pendingIdRef.current = null;
            }
          },
          onStateChange: (e) => {
            const YT = w.YT;
            if (!YT) return;
            console.log("[YT] state:", e?.data);
            if (e.data === YT.PlayerState.PLAYING) {
              setSpinning(true);
            } else {
              setSpinning(false);
            }
            if (e.data === YT.PlayerState.ENDED) {
              fetch("/api/next", {
                method: "POST",
                headers: {
                  "x-player-secret": "lutikmojlubimyj",
                },
              }).catch(() => {});
            }
          },
          onError: (e) => {
            // 2, 5, 100, 101, 150 are common
            console.error("[YT] error code:", e?.data);
          },
        },
      });
      try {
        const iframe = playerRef.current.getIframe?.();
        iframe?.setAttribute?.("allow", "autoplay; encrypted-media");
      } catch {}
    }

    if (w.YT && w.YT.Player) {
      create();
    } else {
      (window as YouTubeWindow).onYouTubeIframeAPIReady = () => create();
    }

    return () => {
      // keep player for reuse between renders
    };
  }, [track?.durationSec, track?.id]);

  // Load new video when track changes
  useEffect(() => {
    const id = track?.id.trim();
    if (!id) return;
    if (playerRef.current && readyRef.current) {
      try {
        playerRef.current.cueVideoById({ videoId: id, startSeconds: 0 });
        playerRef.current.playVideo();
      } catch {
        // ignore errors triggered by player reloads
      }
    } else {
      pendingIdRef.current = id;
    }
  }, [track?.id]);

  // Poll progress if playing
  useEffect(() => {
    function tick() {
      if (!playerRef.current) return;
      try {
        const t = playerRef.current?.getCurrentTime?.() || 0;
        const d = playerRef.current?.getDuration?.() || 0;
        setLocalPos(Math.max(0, Math.floor(t)));
        setLocalDur(d);
      } catch {
        // ignore polling errors and continue scheduling updates
      }
    }
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!playerRef.current || !readyRef.current) return;
    try {
      if (isPlaying) {
        if (playerRef.current.isMuted?.()) {
          playerRef.current.unMute?.();
        }
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch {
      // ignore sync errors when controlling playback from props
    }
  }, [isPlaying]);

  function togglePlay() {
    const p = playerRef.current;
    if (!p) return;
    try {
      const state = (window as YouTubeWindow).YT?.PlayerState;
      const s = p.getPlayerState();
      if (s === state?.PLAYING) p.pauseVideo();
      else {
        try {
          if (p.isMuted?.()) {
            p.unMute?.();
          }
          p.playVideo();
        } catch {
          // ignore transient play errors
        }
      }
    } catch {
      // player state cannot be read
    }
  }

  async function nextTrack() {
    try {
      await fetch("/api/next", {
        method: "POST",
        headers: {
          "x-player-secret": "lutikmojlubimyj",
        },
      });
    } catch {
      // ignore network errors when advancing the track
    }
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
              sizes="64"
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
              ? `${track.author?.name ?? "—"} • @${track.requester ?? ""} ${
                  track.id ? track.id : "no id"
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
          className="range block h-2 w-full cursor-default appearance-none rounded-full bg-[var(--color-bg3)] outline-none [::-webkit-slider-thumb]:appearance-none [::-webkit-slider-thumb]:h-3 [::-webkit-slider-thumb]:w-3 [::-webkit-slider-thumb]:rounded-full [::-webkit-slider-thumb]:bg-[var(--color-highlight)]"
        />
      </div>
    </div>
  );
}
