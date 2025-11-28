import { Router } from "express";
import { db } from "../../db.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { invalidateNukeCache } from "../../lib/botManager.js";

export const NukeRouter = Router();

NukeRouter.get("/", requireAuth, (req, res) => {
  try {
    const broadcasterId = req.user.sid;

    const rows = db
      .prepare(
        "SELECT id, word, created_at FROM nuke_words WHERE broadcaster_id = ? ORDER BY created_at DESC"
      )
      .all(broadcasterId);

    return res.json({ success: true, words: rows });
  } catch (e) {
    console.error("Get /nuke-words error", e);
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

NukeRouter.post("/", requireAuth, (req, res) => {
  try {
    const broadcasterId = req.user.sid;
    let { word } = req.body ?? {};

    if (!word || typeof word !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "Word is required" });
    }

    word = word.trim().toLowerCase();
    if (!word) {
      return res.status(400).json({ success: false, error: "Word is empty" });
    }

    let result;
    try {
      result = db
        .prepare("INSERT INTO nuke_words (broadcaster_id, word) VALUES (?, ?)")
        .run(broadcasterId, word);

      invalidateNukeCache(broadcasterId);
    } catch (e) {
      console.error("POST /nuke-words data access error", e);
      return res
        .status(500)
        .json({ success: false, error: "data's INSERT error" });
    }

    return res.json({
      success: true,
      word: { id: result.lastInsertRowid ?? result.lastID, word },
    });
  } catch (err) {
    console.error("POST /nuke-words error", err);
    return res.status(500).json({ success: false, error: "Internal error" });
  }
});

NukeRouter.delete("/:id", requireAuth, (req, res) => {
  try {
    const broadcasterId = req.user.sid;
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    const result = db
      .prepare("DELETE FROM nuke_words WHERE id = ? AND broadcaster_id = ?")
      .run(id, broadcasterId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    invalidateNukeCache(broadcasterId);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /nuke-words error", err);
    res.status(500).json({ success: false, error: "Internal error" });
  }
});
