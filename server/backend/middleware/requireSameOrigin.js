
import { allowedOrigins } from "../../server.js";

export function requireSameOrigin(req, res, next) {
  let origin = req.headers.origin || null;
  if (!origin && req.headers.referer) {
    try { origin = new URL(req.headers.referer).origin; } catch { /* ignore */ }
  }
  if (origin && allowedOrigins.includes(origin)) return next();
  return res.status(403).json({ error: "cross-origin request rejected" });
}
