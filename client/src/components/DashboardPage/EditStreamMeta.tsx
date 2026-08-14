"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { showToast } from "@/lib/toast";
import { API_BASE_URL } from "@/lib/config";

type Props = {
  initialTitle: string;
  initialGame: string;
  updateStream: any; // server action
};

type GameItem = { id: string; name: string; boxArtUrl?: string };

export default function EditStreamMeta({
  initialTitle,
  initialGame,
  updateStream,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialTitle);
  const [gameName, setGameName] = useState(initialGame);
  const [gameId, setGameId] = useState<string | null>(null);

  const [results, setResults] = useState<GameItem[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [searching, setSearching] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const debouncedQuery = useDebouncedValue(gameName, 300);

  const controllerRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Debounced fetch to internal API
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setSearching(true);
    controllerRef.current?.abort();
    const ac = new AbortController();
    controllerRef.current = ac;

    fetch(
      `${API_BASE_URL}/api/twitch/search/categories?category=${encodeURIComponent(
        q
      )}`,
      {
        signal: ac.signal,
        cache: "no-store",
        credentials: "include",
      }
    )
      .then(async (r) => (r.ok ? r.json() : Promise.reject(await r.text())))
      .then((json) => {
        const data: GameItem[] = json.data ?? [];
        setResults(data);
        setOpen(data.length > 0);
        setHighlight(0);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Search error", err);
          setResults([]);
          setOpen(false);
        }
      })
      .finally(() => setSearching(false));

    return () => ac.abort();
  }, [debouncedQuery]);

  function pickGame(item: GameItem) {
    setGameName(item.name);
    setGameId(item.id);
    setIsSelected(true);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
      scrollIntoView(highlight + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      scrollIntoView(highlight - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickGame(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function scrollIntoView(idx: number) {
    const el = listRef.current?.children?.[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      formData.set("title", title);
      formData.set("game", gameName);
      if (gameId) formData.set("gameId", gameId);

      const result = await updateStream(formData);

      if (result.ok) {
        showToast({
          status: "success",
          title: "The stream's info was successfully updated",
          description: `${title} — ${gameName} `
        });
        setEditing(false);
      } else {
        showToast({
          status: "error",
          title: `Failed to update stream: ${result?.message}`,
        });
        // keep editing open for correction
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <div>
          <div className="max-w-130 wrap-break-word">{title}</div>
          <div className="text-twitch">{gameName}</div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="px-3 py-1 rounded-xl border border-border hover:bg-bg3"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="flex items-end gap-2 relative">
      <label className="flex flex-col">
        <span className="text-sm opacity-80">Title</span>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg3 border border-border outline-none"
        />
      </label>

      <label className="flex flex-col relative">
        <span className="text-sm opacity-80">Game</span>
        <input
          name="game"
          value={gameName}
          onChange={(e) => {
            setGameName(e.target.value);
            setGameId(null); // reset if user starts typing
            setOpen(true);
            setIsSelected(false);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          className="px-3 py-2 rounded-lg bg-bg3 border border-border outline-none"
        />
        {/* ensure id is sent if selected */}
        {gameId && <input type="hidden" name="gameId" value={gameId} />}

        {open && results.length > 0 && (
          <ul
            ref={listRef}
            className="absolute top-[100%] mt-1 z-20 max-h-42 w-full overflow-auto rounded-lg border border-border bg-bg2 shadow-xl"
          >
            {results.map((g, i) => (
              <li key={g.id} className="">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickGame(g);
                  }}
                  onMouseOver={() => setHighlight(i)}
                  className={`flex items-center w-full gap-3 px-3 py-2  ${
                    i === highlight ? "bg-bg3" : ""
                  }`}
                >
                  {g.boxArtUrl ? (
                    <img
                      src={g.boxArtUrl}
                      alt=""
                      width={26}
                      height={36}
                      className="rounded"
                    />
                  ) : (
                    <div className="w-[26px] h-[36px] rounded bg-bg3" />
                  )}
                  <span>{g.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && searching && results.length === 0 && (
          <div className="absolute top-[100%] mt-1 z-20 w-full px-3 py-2 rounded-lg border border-border bg-bg2 shadow-xl text-sm opacity-80">
            Searching…
          </div>
        )}
      </label>

      <div className="flex justify-center items-end gap-2">
        <button
          type="submit"
          disabled={!isSelected}
          className="px-3 py-2 rounded-xl bg-twitch text-white disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-3 py-2 rounded-xl border border-border"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
