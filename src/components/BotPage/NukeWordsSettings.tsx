"use client";

import { useEffect, useState } from "react";
import { Bomb } from "lucide-react";

type NukeWord = {
  id: number;
  word: string;
  created_at?: string;
};

export default function NukeWordsSettings() {
  const [words, setWords] = useState<NukeWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/api/nuke-words", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setWords(data.words);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newWord.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("http://localhost:3000/api/nuke-words", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newWord }),
      });
      const data = await res.json();
      if (data.success && data.word) {
        setWords((prev) => [data.word, ...prev]);
        setNewWord("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const prev = words;
    setWords((w) => w.filter((x) => x.id !== id));
    try {
      const res = await fetch(`http://localhost:3000/api/nuke-words/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        // rollback on error
        setWords(prev);
      }
    } catch {
      setWords(prev);
    }
  }

  return (
    <div className="relative space-y-4 rounded-2xl border border-border bg-bg2 p-4 max-h-37">
      <form onSubmit={handleAdd} className="relative">
        <input
          className="flex-1 rounded-xl border border-border focus:border-highlight bg-bg px-3 py-2 text-lg outline-none h-15 w-[400px] "
          placeholder="Blacklist a phrase..."
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving || !newWord.trim()}
          className="absolute cursor-pointer right-0 top-1/2 -translate-y-1/2 rounded-r-xl px-4 py-2 border-highlight border-1 text-sm font-medium h-full bg-bg3 active:bg-twitch hover:bg-twitch/50 text-white disabled:border-0 disabled:bg-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Bomb />
        </button>
      </form>

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-xl w-40 h-10 bg-gradient-to-b from-bg2 from-90% to-bg3 border-1 border-border hover:from-5% hover:border-t-highlight transition-all"
      >
        {isOpen ? "Hide" : "Show"} Blacklist
      </button>

      {isOpen && (
        <>
        {loading && <p>loading...</p>}
          <ul className="absolute -bottom-35 right-4 space-y-2 w-1/2 h-50 rounded-xl border-border border-t-highlight border overflow-y-scroll flex flex-col justify-start scrollbar p-2 bg-gradient-to-b from-bg2 to-bg3">
            {words.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-xl bg-bg px-3 py-2 text-md"
              >
                <span>{w.word}</span>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="text-xs cursor-pointer text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </li>
            ))}            
          </ul>
        </>
      )}
    </div>
  );
}
