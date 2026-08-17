import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { resolveTrack, enqueue, playNext, getState } from "../../services/player.js";

export const APIRouter = Router();

APIRouter.post("/enqueue", requireAuth, async (req, res) => {
  try {
    const { videoId, requester } = req.body || {};
    if (!videoId) return res.status(400).json({ error: "videoId is required" });

    const tenantId = req.user.sid || "";
    if (!tenantId) {
      return res.status(404).json({ error: `Tenant not found` });
    }

    const who = requester || "web";
    const query = `https://www.youtube.com/watch?v=${videoId}`;
    const track = await resolveTrack(query, who);

    enqueue(tenantId, track);
    const { nowPlaying } = getState(tenantId);
    if (!nowPlaying) playNext(tenantId);

    return res.json({ track, requester: who });
  } catch (error) {
    return res.status(400).json({ error: String(error.message || error) });
  }
});

APIRouter.post("/next", requireAuth, (req, res) => {
  const tenantId = req.user.sid || "";
  if (!tenantId) {
    return res.status(404).json({ error: `Tenant not found` });
  }

  playNext(tenantId);
  res.json({ ok: true });
});

APIRouter.get("/state", requireAuth, (req, res) => {
  const tenantId = req.user.sid || "";
  if (!tenantId) {
    return res.status(404).json({ error: `Tenant not found` });
  }

  const { QUEUE, nowPlaying } = getState(tenantId);
  return res.json({ queue: QUEUE, nowPlaying });
});