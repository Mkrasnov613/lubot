
import PlayerBar from "./PlayerBar";
import { cookies } from "next/headers";

export default async function PlayerPanel() {
  const cookieHeader = (await cookies()).toString();
  let tenantId: string | null = null;

  try {
    const res = await fetch(
      "http://localhost:3000/api/data/tenant?data=tenant_id",
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
  } catch {}

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
    const playerRes = await fetch("http://localhost:3000/api/player/state", {
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
    <div className="flex items-center justify-center gap-4 bg-bg2 h-23 rounded-xl w-full mb-5">
      {/* PLAYER */}
      <PlayerBar
        initialQueue={initialPlayerState.queue}
        initialNowPlaying={initialPlayerState.nowPlaying}
        tenantId={tenantId}
      />
    </div>
  );
}
