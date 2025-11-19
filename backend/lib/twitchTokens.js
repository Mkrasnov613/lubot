import axios from "axios";
import db from "../db.js";

export function isExpiredOrSoon(expiresAtISO, marginMs = 5 * 60 * 1000) {
  if (!expiresAtISO) return true;
  const now = Date.now();
  const exp = new Date(expiresAtISO).getTime();
  return exp - now <= marginMs;
}

export async function refreshTokenRow(tenantId, table = "twitch_tokens") {
  const row = db.prepare(`SELECT * FROM ${table} WHERE tenant_id = ?`).get(tenantId);
  if (!row) throw new Error(`No token row in ${table} for tenant ${tenantId}`);

  if (!isExpiredOrSoon(row.access_expires_at)) return row.access_token;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: row.refresh_token,
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
  });

  const res = await axios.post(
    "https://id.twitch.tv/oauth2/token",
    body.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { access_token, refresh_token, expires_in, scope } = res.data;
  const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  db.prepare(`
    UPDATE ${table}
    SET access_token = @access_token,
        refresh_token = @refresh_token,
        access_expires_at = @access_expires_at,
        scope = @scope
    WHERE tenant_id = @tenant_id
  `).run({
    tenant_id: tenantId,
    access_token,
    refresh_token,
    access_expires_at: newExpiresAt,
    scope: Array.isArray(scope) ? scope.join(" ") : (scope ?? ""),
  });

  return access_token;
}
