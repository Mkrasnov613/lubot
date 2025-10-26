const PLAYER_SECRET = process.env.PLAYER_SECRET;

export function assertPlayer(req, res, next) {
  const hdr = req.headers["x-player-secret"] || req.query.key;
  if (hdr && hdr === PLAYER_SECRET) return next();
  return res.status(401).json({ error: "unauthorized player" });
}
