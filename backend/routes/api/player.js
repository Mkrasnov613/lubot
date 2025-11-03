import { Router } from "express";
import { assertPlayer } from "../../middleware/assertPlayer.js";
import { resolveTrack, enqueue, playNext, getState } from "../../lib/player.js";

export const APIRouter = Router();

APIRouter.post("/enqueue", async (req, res) => {
  try {
    const { videoId, requester } = req.body || {};
    const who = requester || "web";
    if (!videoId) return res.status(400).json({ error: "videoId is required" });

    const query = `https://www.youtube.com/watch?v=${videoId}`;
    const track = await resolveTrack(query, who);

    enqueue(track);
    if (!getState().nowPlaying) playNext();

    return res.json({ track, requester: who });
  } catch (error) {
    return res.status(400).json({ error: String(error.message || error) });
  }
});

APIRouter.post("/next", assertPlayer, (_req, res) => {
  playNext();
  res.json({ ok: true });
});