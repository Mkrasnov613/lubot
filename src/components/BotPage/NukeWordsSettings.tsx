"use client";

import { useEffect, useState } from "react";

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
    <div className="space-y-4 rounded-2xl border border-border bg-bg2 p-4">
      <h2 className="text-lg font-semibold">Nuke words</h2>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none"
          placeholder="badword"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving || !newWord.trim()}
          className="rounded-xl px-4 py-2 text-sm font-medium bg-purple-600 text-white disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : words.length === 0 ? (
        <p className="text-sm text-muted">No nuke words yet.</p>
      ) : (
        <ul className="space-y-2">
          {words.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between rounded-xl bg-bg px-3 py-2 text-sm"
            >
              <span>{w.word}</span>
              <button
                onClick={() => handleDelete(w.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
