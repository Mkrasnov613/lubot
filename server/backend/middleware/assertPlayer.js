// middleware/assertPlayer.js
import { verifySession } from "../utils/session.js";
import { db } from "../db.js";

export function assertPlayer(req, res, next) {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: "No session" });

    const user = verifySession(token); // { sid, login, ... }
    if (!user?.sid) return res.status(401).json({ error: "Invalid session" });

    req.user = user; // прокинем дальше
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid session" });
  }
}
