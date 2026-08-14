import QueuePanel from "@/components/MusicPlayer/QueuePanel";
import PlayerPanel from "@/components/MusicPlayer/PlayerPanel";
import { cookies } from "next/headers";
import SearchOverlay from "@/components/MusicPlayer/SearchOverlay";
import { API_BASE_URL } from "@/lib/config";

export default async function MusicPage() {
  const cookieHeader = (await cookies()).toString();
  let tenantId: string | null = null;

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/data/tenant?data=tenant_id`,
      {
        headers: { cookie: cookieHeader },
        cache: "no-store",
      }
    );

    if (res.ok) {
      // Try to parse as JSON first, then fall back to text
      const data = await res.json();
      tenantId = data.tenantId || data || null;
    }
  } catch {
  }

  // If tenantId is not available, return early or show error
  if (!tenantId) {
    return (
      <section className="flex flex-wrap justify-around gap-5 items-center min-h-screen mx-auto max-w-[1680px] p-10 text-[var(--color-text)] bg-bg1">
        <div className="w-[700px]">
          <p>Unable to load player. Please ensure you are authenticated.</p>
        </div>
      </section>
    );
  }

  let initialPlayerState = { queue: [], nowPlaying: null };
  try {
    const playerRes = await fetch(`${API_BASE_URL}/api/player/state`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (playerRes.ok) {
      initialPlayerState = await playerRes.json();
    }
  } catch {
    // Silently fail - WebSocket will provide state on connect
  }

  return (
    <section className="relative flex flex-wrap justify-around gap-5 items-center min-h-screen mx-auto max-w-[1680px] p-10 text-[var(--color-text)] bg-bg1">
      <div className="w-[700px]">
        <PlayerPanel
          initialQueue={initialPlayerState.queue}
          initialNowPlaying={initialPlayerState.nowPlaying}
          tenantId={tenantId}
        />
      </div>
      <div className="">
        <QueuePanel
          initialQueue={initialPlayerState.queue}
          initialNowPlaying={initialPlayerState.nowPlaying}
          tenantId={tenantId}
        />
      </div>
      <div className="absolute top-0 z-100">
        <SearchOverlay />
      </div>
    </section>
  );
}
