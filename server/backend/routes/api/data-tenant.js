import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { pool } from "../../db/connection.js";

export const dataTenantRouter = Router();

dataTenantRouter.get("/tenant", requireAuth, async (req, res) => {
  const query = req.query.data;
  const twitchUserID = req.user.sid;

  if (query === "tenant_id") {
    return res.send(twitchUserID);
  }

  const columns = { slug: "slug", avatar_url: "avatar_url" };
  const column = columns[query];

  if (!column) {
    return res.status(400).json({ error: "Unsupported data query" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT ${column} FROM tenants WHERE twitch_user_id = $1`,
      [twitchUserID]
    );
    return res.send(rows[0]);
  } catch (e) {
    console.error("[data/tenant] query failed:", e.message);
    return res.status(500).json({ error: "database unavailable" });
  }
});
