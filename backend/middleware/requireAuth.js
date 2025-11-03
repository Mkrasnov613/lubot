import { verifySession } from "../utils/session.js";
import jwt from "jsonwebtoken"

export function requireAuth(req, res, next) {
  const token = req.cookies?.sid;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const session = verifySession(token); 
    req.user = session;
    return next();
  } catch (e) {
    console.error("JWT verify failed:", e?.name, e?.message);
    return res.status(401).json({ error: "invalid or expired session" });
  }
}

