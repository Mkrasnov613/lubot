import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PLAYER_SECRET = process.env.PLAYER_SECRET;

export function assertPlayer(req, res, next) {
  const hdr = req.headers["x-player-secret"] || req.query.key;
  if (hdr && hdr === PLAYER_SECRET) return next();
  return res.status(401).json({ error: "unauthorized player" });
}
