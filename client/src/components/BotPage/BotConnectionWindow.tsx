"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

type BotStatus = "connected" | "disconnected";

export default function BotConnectionWindow() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bot/status`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && data.success) setStatus(data.status);
      } catch (e) {
        console.error("bot status fetch failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleBot() {
    if (!status || toggling) return;
    const action = status === "connected" ? "disable" : "enable";

    setToggling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bot/${action}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setStatus(data.status);
    } catch (e) {
      console.error("bot toggle failed:", e);
    } finally {
      setToggling(false);
    }
  }

  const isConnected = status === "connected";

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-bg2 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-full p-2 ${
            isConnected ? "bg-green-500/20 text-green-400" : "bg-bg3 text-muted"
          }`}
        >
          <Bot />
        </div>
        <div>
          <div className="font-semibold">
            LuBot is{" "}
            {loading
              ? "checking status…"
              : isConnected
              ? "connected"
              : "disconnected"}
          </div>
          <p className="text-muted text-sm">
            Use commands like{" "}
            <span className="font-mono bg-bg3 px-1 rounded">!sr</span>,{" "}
            <span className="font-mono bg-bg3 px-1 rounded">!song</span>, and{" "}
            <span className="font-mono bg-bg3 px-1 rounded">!queue</span>.
          </p>
        </div>
      </div>

      <button
        onClick={toggleBot}
        disabled={loading || toggling || status === null}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          isConnected
            ? "border border-border hover:bg-bg3"
            : "bg-twitch text-white hover:bg-twitch/80"
        }`}
      >
        {toggling && <Loader2 className="w-4 h-4 animate-spin" />}
        {isConnected ? "Disconnect bot" : "Connect bot"}
      </button>
    </div>
  );
}
