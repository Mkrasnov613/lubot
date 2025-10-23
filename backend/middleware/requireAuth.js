import { verifySession } from "../utils/session.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.sid;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const session = verifySession(token);
    req.user = session;
    return next()
  } catch {
    return res.status(401).json({error: "invalid or expired session"})
  }
}
