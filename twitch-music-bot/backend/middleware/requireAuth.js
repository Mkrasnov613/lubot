import { verifySession, signSession } from "../utils/session.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.sid;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const session = verifySession(token);
    req.user = session;
    const newToken = signSession({ sid: session.sid, login: session.login });
    res.cookie("sid", newToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // refresh TTL
    });
    return next();
  } catch (e) {
    console.error("JWT verify failed:", e?.name, e?.message);
    return res.status(401).json({ error: "invalid or expired session" });
  }
}
