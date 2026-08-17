// routes/api/bot.ts
import { Router } from "express";
import { enableBot, disableBot, botStatus } from "../../services/botManager.js";
import { verifySession } from "../../utils/session.js";
import { requireAuth } from "../../middleware/requireAuth.js";

export const BotRouter = Router();

BotRouter.post("/enable", requireAuth, async (req, res) => {
  const tenantId = req.user.sid;

  try {
    await enableBot(tenantId);
    res.json({ success: true, status: botStatus(tenantId) });
  } catch (e) {
    res.status(400).json({
      success: false,
      error: e?.message || String(e),
    });
  }
});

BotRouter.post("/disable", requireAuth, async (req, res) => {
  const tenantId = req.user.sid;

  try {
    await disableBot(tenantId);
    res.json({ success: true, status: botStatus(tenantId) });
  } catch (e) {
    res.status(400).json({
      success: false,
      error: e?.message || String(e),
    });
  }
});

BotRouter.get("/status", requireAuth, (req, res) => {
  const tenantId = req.user.sid; 
  const status = botStatus(tenantId);
  res.json({ success: true, status });
});
