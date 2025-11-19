// lib/luBotTokens.js
import db from "../db.js";
import axios from "axios";

const TWITCH_CLIENT_ID = (process.env.TWITCH_CLIENT_ID || "").trim();
const TWITCH_CLIENT_SECRET = (process.env.TWITCH_CLIENT_SECRET || "").trim();

const SEED_ACCESS = process.env.LUBOT_OAUTH_TOKEN || "";
const SEED_REFRESH = process.env.LUBOT_REFRESH_TOKEN || "";

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS lubot_tokens (
    id TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    access_expires_at TEXT NOT NULL,
    scope TEXT
  );
`
).run();

function getBotRow() {
  return db.prepare(`SELECT * FROM lubot_tokens WHERE id = 'global'`).get();
}

function saveBotRow({ access_token, refresh_token, expires_in, scope }) {
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  db.prepare(
    `
    INSERT INTO lubot_tokens (id, access_token, refresh_token, access_expires_at, scope)
    VALUES ('global', @access_token, @refresh_token, @access_expires_at, @scope)
    ON CONFLICT(id) DO UPDATE SET
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      access_expires_at = excluded.access_expires_at,
      scope = excluded.scope;
  `
  ).run({
    access_token,
    refresh_token,
    access_expires_at: expiresAt,
    scope: Array.isArray(scope) ? scope.join(" ") : String(scope ?? ""),
  });
}

function seedFromEnvIfNeeded() {
  const row = getBotRow();
  if (row) return row;

  if (!SEED_ACCESS || !SEED_REFRESH) {
    return null;
  }

  // give it some initial fake expiry in the future, it will be refreshed soon anyway
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // +1 day

  db.prepare(
    `
    INSERT INTO lubot_tokens (id, access_token, refresh_token, access_expires_at, scope)
    VALUES ('global', @access_token, @refresh_token, @access_expires_at, @scope)
    ON CONFLICT(id) DO UPDATE SET
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      access_expires_at = excluded.access_expires_at,
      scope = excluded.scope;
  `
  ).run({
    access_token: SEED_ACCESS,
    refresh_token: SEED_REFRESH,
    access_expires_at: expiresAt,
    scope: "chat:read chat:edit",
  });

  console.log("🌱 Seeded LuBot tokens from .env into lubot_tokens");
  return getBotRow();
}

// Main function: always returns a valid LuBot access token
export async function getBotAccessToken() {
  const row = getBotRow() || seedFromEnvIfNeeded();

  if (!row) {
    throw new Error(
      "No LuBot tokens in DB and no env seed. Set LUBOT_ACCESS_TOKEN and LUBOT_REFRESH_TOKEN or insert manually."
    );
  }

  const now = Date.now();
  const exp = new Date(row.access_expires_at).getTime();
  const almostExpired = exp - now < 60 * 1000;

  if (!almostExpired) {
    return row.access_token;
  }

  // Refresh
  const body = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    client_secret: TWITCH_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: row.refresh_token,
  });

  try {
    const resp = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      body.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, refresh_token, expires_in, scope } = resp.data;
    saveBotRow({ access_token, refresh_token, expires_in, scope });

    console.log("🔁 LuBot token refreshed");
    return access_token;
  } catch (e) {
    console.error("Failed to refresh LuBot token:", e?.response?.data || e);
    // fallback to old token – might fail later, but avoids crashing now
    return row.access_token;
  }
}
