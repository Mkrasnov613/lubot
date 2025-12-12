import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { db } from "../../db.js";

export const dataTenantRouter = Router();

dataTenantRouter.get("/tenant", requireAuth, (req, res) => {
  const query = req.query.data;
  const twitchUserID = req.user.sid;

  if (query === "tenant_id") {
    return res.send(twitchUserID);
  }

  if (query === "slug") {
    const slug = db
      .prepare(`SELECT slug FROM tenants WHERE twitch_user_id = ?`)
      .get(twitchUserID);
    return res.send(slug);
  }

  if (query === "avatar_url") {
    const avatar_url = db
      .prepare("SELECT avatar_url FROM tenants WHERE twitch_user_id = ?")
      .get(twitchUserID);
    return res.send(avatar_url);
  }

  return res.status(400).json({ error: "Unsupported data query" });
});
