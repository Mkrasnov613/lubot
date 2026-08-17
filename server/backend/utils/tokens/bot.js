import { db } from "../../db/connection.js";
import axios from "axios";

const TWITCH_CLIENT_ID = (process.env.TWITCH_CLIENT_ID || "").trim();
const TWITCH_CLIENT_SECRET = (process.env.TWITCH_CLIENT_SECRET || "").trim();

const SEED_ACCESS = process.env.LUBOT_OAUTH_TOKEN || "";
const SEED_REFRESH = process.env.LUBOT_REFRESH_TOKEN || "";

// Schema owned by utils/initDB.js — see the lubot_tokens table there.
export function getBotRow() {
  return db.prepare(`SELECT * FROM lubot_tokens WHERE id = 'global'`).get();
}

export function saveBotRow({ access_token, refresh_token, expires_in, scope }) {
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

// Main function: always returns a valid LuBot access token
export async function getBotAccessToken() {
  let row = getBotRow();

  if (!row) {
    throw new Error(
      "No LuBot tokens. Visit /auth/lubot/login as the bot account or set LUBOT_OAUTH_TOKEN/LUBOT_REFRESH_TOKEN."
    );
  }

  const now = Date.now();
  const exp = new Date(row.access_expires_at).getTime();
  const almostExpired = exp - now < 60 * 1000;

  if (!almostExpired) {
    return row.access_token;
  }

  // Refresh with Twitch OAuth
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
    // Fallback: use old token instead of returning undefined
    return row.access_token;
  }
}
