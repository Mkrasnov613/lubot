"use client";

import type { Track } from "@/types/musicPlayer";
import { useMemo, useRef, useState, useEffect } from "react";
import { formatTime } from "@/lib/utils";
import Image from "next/image";
import { Play, Pause, SkipForward, List, Search, X } from "lucide-react";
import { useQueue } from "@/hooks/useQueue";
import { showToast } from "@/lib/toast";
import SearchOverlay from "./SearchOverlay";
import QueuePanel from "./QueuePanel";
import { API_BASE_URL } from "@/lib/config";
import { Box, Flex, chakra } from "@chakra-ui/react";

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
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
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
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; CUED: number };
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
  initialQueue,
  initialNowPlaying,
  tenantId,
}: {
  initialQueue: Track[];
  initialNowPlaying: Track | null;
  tenantId: string;
}) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { queue, nowPlaying, isPlaying, positionSec, durationSec } = useQueue(
    initialQueue,
    initialNowPlaying,
    tenantId
  );

  const prevIdsRef = useRef<string[] | null>(null);

  // Track the current video ID to avoid reloading the same video
  const currentVideoIdRef = useRef<string | null>(null);
  const lastIsPlayingRef = useRef(isPlaying);
  const nextTrackTriggeredRef = useRef(false);
  const isSeekingRef = useRef(false);
  const positionSecRef = useRef(positionSec);
  const isPlayingRef = useRef(isPlaying);
  const trackRef = useRef(nowPlaying);

  // Local state from iframe
  const [localPos, setLocalPos] = useState(0);
  const [localDur, setLocalDur] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const progress = useMemo(() => {
    const dur = localDur || durationSec || nowPlaying?.durationSec || 0;
    const pos = localPos || positionSec || 0;
    return dur ? Math.min(100, Math.max(0, (pos / dur) * 100)) : 0;
  }, [localPos, localDur, positionSec, durationSec, nowPlaying?.durationSec]);

  useEffect(() => {
    const currIds = queue.map((t) => t.id);

    if (prevIdsRef.current) {
      const prevIds = prevIdsRef.current;

      const addedIds = currIds.filter((id) => !prevIds.includes(id));

      if (addedIds.length > 0) {
        const addedTracks = queue.filter((t) => addedIds.includes(t.id));

        if (addedTracks.length === 1) {
          const t = addedTracks[0];
          showToast({
            title: "Track was added to the queue",
            description: `${t.title} — ${t.author?.name ?? "Unknown author"}`,
            status: "success",
          });
        } else {
          showToast({
            title: "Tracks were added to the queue",
            description: `${addedTracks.length} new tracks`,
            status: "success",
          });
        }
      }
    }

    prevIdsRef.current = currIds;
  }, [queue]);

  // Load YouTube Iframe API
  useEffect(() => {
    const w = window as YouTubeWindow;
    if (w.YT?.Player) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  // Create player instance
  useEffect(() => {
    const w = window as YouTubeWindow;
    if (!mountRef.current) return;

    const createPlayer = () => {
      if (playerRef.current || !mountRef.current || !w.YT) return;

      playerRef.current = new w.YT.Player(mountRef.current, {
        height: "0",
        width: "0",
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            try {
              playerRef.current?.mute?.();
            } catch {}

            // Load pending track if any
            const pendingTrack = trackRef.current;
            if (pendingTrack?.id) {
              const videoId = safeId(pendingTrack.id);
              if (videoId) {
                loadVideo(
                  videoId,
                  positionSecRef.current,
                  isPlayingRef.current
                );
              }
            }
          },
          onStateChange: (e) => {
            const YT = w.YT;
            if (!YT) return;

            const state = e?.data;
            console.log("[YT] state change:", state);
            setSpinning(state === YT.PlayerState.PLAYING);

            // Handle video ended
            if (state === YT.PlayerState.ENDED) {
              console.log("[YT] Video ended, triggering next track");
              if (!nextTrackTriggeredRef.current) {
                nextTrackTriggeredRef.current = true;
                fetch(`${API_BASE_URL}/api/player/next`, {
                  method: "POST",
                  credentials: "include",
                }).catch(() => {});
              }
            }

            // Reset seeking flag when video starts playing
            if (state === YT.PlayerState.PLAYING) {
              isSeekingRef.current = false;
            }
          },
          onError: (e) => {
            console.error("[YT] error code:", e?.data);
          },
        },
      });

      try {
        playerRef.current
          .getIframe?.()
          ?.setAttribute("allow", "autoplay; encrypted-media");
      } catch {}
    };

    if (w.YT?.Player) {
      createPlayer();
    } else {
      (window as YouTubeWindow).onYouTubeIframeAPIReady = createPlayer;
    }
  }, []);

  // Load video at correct timecode - ONLY when track ID changes
  const loadVideo = (
    videoId: string,
    startPos: number,
    shouldPlay: boolean
  ) => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;

    try {
      const startSeconds = Math.max(0, Math.floor(startPos));
      currentVideoIdRef.current = videoId;
      nextTrackTriggeredRef.current = false;
      isSeekingRef.current = true;

      if (startSeconds > 0) {
        // Use cueVideoById for non-zero positions, then seek when ready
        p.cueVideoById({ videoId, startSeconds });
        // After a short delay, seek to exact position and play if needed
        setTimeout(() => {
          try {
            if (playerRef.current && currentVideoIdRef.current === videoId) {
              playerRef.current.seekTo?.(startSeconds, true);
              if (shouldPlay) {
                playerRef.current.unMute?.();
                playerRef.current.playVideo();
              }
            }
          } catch {}
        }, 500);
      } else {
        // Start from beginning
        p.loadVideoById?.({ videoId, startSeconds: 0 });
        if (shouldPlay) {
          p.unMute?.();
          p.playVideo();
        }
      }
    } catch (error) {
      console.error("[YT] Error loading video:", error);
    }
  };

  // Update refs
  useEffect(() => {
    positionSecRef.current = positionSec;
    isPlayingRef.current = isPlaying;
    trackRef.current = nowPlaying;
  }, [positionSec, isPlaying, nowPlaying]);

  // Load video only when track ID changes
  useEffect(() => {
    const videoId = safeId(nowPlaying?.id);

    // Only load if video ID actually changed
    if (!videoId || videoId === currentVideoIdRef.current) {
      return;
    }

    if (readyRef.current) {
      loadVideo(videoId, positionSecRef.current, isPlayingRef.current);
    }
    // If not ready, the onReady handler will load it
  }, [nowPlaying?.id]);

  // Sync play/pause state - only when isPlaying actually changes
  useEffect(() => {
    // Skip if we're currently seeking/loading
    if (isSeekingRef.current) {
      lastIsPlayingRef.current = isPlaying;
      return;
    }

    const p = playerRef.current;
    if (!p || !readyRef.current || !currentVideoIdRef.current) return;

    // Only sync if state actually changed
    if (lastIsPlayingRef.current === isPlaying) {
      return;
    }

    try {
      const YT = (window as YouTubeWindow).YT;
      if (!YT) return;

      const currentState = p.getPlayerState();
      const shouldPlay = isPlaying && currentState !== YT.PlayerState.PLAYING;
      const shouldPause = !isPlaying && currentState === YT.PlayerState.PLAYING;

      if (shouldPlay) {
        p.unMute?.();
        p.playVideo();
        lastIsPlayingRef.current = true;
      } else if (shouldPause) {
        p.pauseVideo();
        lastIsPlayingRef.current = false;
      }
    } catch (error) {
      console.error("[YT] Error syncing play state:", error);
    }
  }, [isPlaying]);

  // Poll progress from iframe - update local state only
  useEffect(() => {
    const tick = () => {
      const p = playerRef.current;
      if (!p || !readyRef.current) return;

      try {
        const YT = (window as YouTubeWindow).YT;
        if (!YT) return;

        const t = p.getCurrentTime?.() || 0;
        const d = p.getDuration?.() || 0;
        const currentPos = Math.max(0, Math.floor(t));
        const currentState = p.getPlayerState();

        setLocalPos(currentPos);
        if (d > 0) {
          setLocalDur(d);
        }

        // Check if track ended - either by state or by position
        const effectiveDur = d || durationSec || nowPlaying?.durationSec || 0;

        // Check 1: Player state is ENDED
        if (
          currentState === YT.PlayerState.ENDED &&
          !nextTrackTriggeredRef.current
        ) {
          console.log(
            "[YT] Detected ENDED state from progress poll, triggering next track"
          );
          nextTrackTriggeredRef.current = true;
          fetch(`${API_BASE_URL}/api/player/next`, {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
          return;
        }

        // Check 2: Position-based check (fallback if ENDED state doesn't fire)
        // Only check if player is playing and we're very close to or past the end
        if (
          effectiveDur > 0 &&
          currentState === YT.PlayerState.PLAYING &&
          currentPos >= Math.max(1, effectiveDur - 1) &&
          !nextTrackTriggeredRef.current
        ) {
          console.log(
            "[YT] Track position reached end, triggering next track",
            {
              currentPos,
              effectiveDur,
              diff: effectiveDur - currentPos,
            }
          );
          nextTrackTriggeredRef.current = true;
          fetch(`${API_BASE_URL}/api/player/next`, {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
        }
      } catch {}
    };

    const id = setInterval(tick, 500); // Check more frequently for better detection
    return () => clearInterval(id);
  }, [durationSec, nowPlaying?.durationSec, nowPlaying?.id]);

  // Handle page visibility - keep playing in background
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Do nothing - let the player continue in background
      // YouTube iframe will handle this automatically
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Update current video ID ref when track changes
  useEffect(() => {
    const videoId = safeId(nowPlaying?.id);
    if (videoId && videoId !== currentVideoIdRef.current) {
      console.log(
        "[YT] Track changed from",
        currentVideoIdRef.current,
        "to",
        videoId
      );
      currentVideoIdRef.current = videoId;
      nextTrackTriggeredRef.current = false; // Reset when track changes
    } else if (!videoId) {
      // Track cleared
      currentVideoIdRef.current = null;
      nextTrackTriggeredRef.current = false;
    }
  }, [nowPlaying?.id]);

  function togglePlay() {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;

    try {
      const YT = (window as YouTubeWindow).YT;
      if (!YT) return;

      const state = p.getPlayerState();
      if (state === YT.PlayerState.PLAYING) {
        p.pauseVideo();
        lastIsPlayingRef.current = false;
      } else {
        p.unMute?.();
        p.playVideo();
        lastIsPlayingRef.current = true;
      }
    } catch (error) {
      console.error("[YT] Error toggling play:", error);
    }
  }

  async function nextTrack() {
    try {
      await fetch(`${API_BASE_URL}/api/player/next`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
  }

  return (
    <Flex gap="5" w="100%" align="center" justify="space-between" overflow="hidden">
      {/* Artwork */}
      <Flex align="center" gap="5">
        <Box position="relative" w="23" h="23">
          <Image
            src={nowPlaying?.thumb || "/fallback-albumcover.png"}
            alt={nowPlaying?.title || "Album cover"}
            fill
            style={{ objectFit: "cover" }}
            sizes=""
          />
        </Box>
        <Box truncate display="flex" flexDir="column" justifyContent="center" alignItems="flex-start" gap="2" fontSize="md" fontWeight="medium">
          {nowPlaying ? nowPlaying.title : "Waiting for a track"}
          <Box color="textMuted">
            {nowPlaying
              ? `${nowPlaying.author?.name ?? "—"} • @${
                  nowPlaying.requester ?? ""
                }`
              : ""}
          </Box>
        </Box>
      </Flex>
      <Flex minW="115" direction="column" align="center" justify="center">
        <Flex align="center" justify="center" position="relative" w="20">
          <chakra.button
            onClick={togglePlay}
            title="Play/Pause"
            cursor="pointer"
            disabled={isPlaying}
          >
            <Box bg="surface" p="3" transition="background-color 0.15s ease" _hover={isPlaying ? { bg: "surface2" } : undefined} rounded="full">
              {spinning ? <Play /> : <Pause />}
            </Box>
          </chakra.button>
          <chakra.button
            onClick={nextTrack}
            disabled={isPlaying}
            position="absolute"
            right="-2.5rem"
            cursor="pointer"
          >
            <Box bg="surface" p="3" transition="background-color 0.15s ease" _hover={isPlaying ? { bg: "surface2" } : undefined} rounded="full">
              <SkipForward />
            </Box>
          </chakra.button>
        </Flex>

        {/* Hidden iframe mount point (0x0) */}
        <Box h="0" w="0" overflow="hidden">
          <Box ref={mountRef} />
        </Box>

        {/* Progress */}
        <Flex mt="3" alignSelf="stretch" align="center" gap="3" fontSize="xs" style={{ fontVariantNumeric: "tabular-nums" }} color="textMuted">
          <Box as="span">{formatTime(localPos || positionSec)}</Box>
          <chakra.input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            readOnly
            display="block"
            h="2"
            w="100%"
            cursor="default"
            style={{ appearance: "none" }}
            rounded="full"
            bg="surface2"
            outline="none"
            css={{
              "&::-webkit-slider-thumb": {
                height: "0.75rem",
                width: "0.75rem",
                appearance: "none",
                borderRadius: "9999px",
                background: "var(--color-accent-700)",
              },
            }}
          />
          <Box as="span">
            {formatTime(
              localDur || durationSec || nowPlaying?.durationSec || 0
            )}
          </Box>
        </Flex>
      </Flex>

      {/* Right side buttons */}
      <Flex minW="60" align="center" justify="flex-end" gap="2">
        <Box
          as="button"
          onClick={() => setShowQueue(!showQueue)}
          bg="surface"
          transition="background-color 0.15s ease"
          _hover={{ bg: "surface2" }}
          rounded="full"
          p="3"
          title="Show queue"
        >
          <List size={20} />
        </Box>
        <Box
          as="button"
          onClick={() => setShowSearch(!showSearch)}
          bg="surface"
          transition="background-color 0.15s ease"
          _hover={{ bg: "surface2" }}
          rounded="full"
          p="3"
          title="Search music"
        >
          <Search size={20} />
        </Box>
      </Flex>

      {/* Queue Overlay */}
      {showQueue && (
        <Flex
          position="fixed"
          inset="0"
          zIndex={50}
          align="center"
          justify="center"
          bg="blackAlpha.500"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={() => setShowQueue(false)}
        >
          <Box
            className="shadow-large"
            position="relative"
            bg="surface"
            rounded="2xl"
            borderWidth="1px"
            borderColor="border"
            maxW="md"
            w="100%"
            maxH="80vh"
            mx="4"
            onClick={(e) => e.stopPropagation()}
          >
            <Box position="absolute" top="4" right="4" zIndex={10}>
              <Box
                as="button"
                onClick={() => setShowQueue(false)}
                bg="surface2"
                transition="background-color 0.15s ease"
                _hover={{ bg: "surface" }}
                rounded="full"
                p="2"
                title="Close"
              >
                <X size={16} />
              </Box>
            </Box>
            <Box p="6" pt="12">
              <QueuePanel
                initialQueue={initialQueue}
                initialNowPlaying={initialNowPlaying}
                tenantId={tenantId}
              />
            </Box>
          </Box>
        </Flex>
      )}

      {/* Search Overlay */}
      {showSearch && (
        <Flex
          position="fixed"
          inset="0"
          zIndex={50}
          align="center"
          justify="center"
          bg="blackAlpha.500"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={() => setShowSearch(false)}
        >
          <Box
            className="shadow-large"
            position="relative"
            bg="surface"
            rounded="2xl"
            borderWidth="1px"
            borderColor="border"
            maxW="2xl"
            w="100%"
            maxH="80vh"
            mx="4"
            overflow="hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Box position="absolute" top="4" right="4" zIndex={10}>
              <Box
                as="button"
                onClick={() => setShowSearch(false)}
                bg="surface2"
                transition="background-color 0.15s ease"
                _hover={{ bg: "surface" }}
                rounded="full"
                p="2"
                title="Close"
              >
                <X size={16} />
              </Box>
            </Box>
            <SearchOverlay onClose={() => setShowSearch(false)} />
          </Box>
        </Flex>
      )}
    </Flex>
  );
}
