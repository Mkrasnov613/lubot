import axios from "axios";
import { pool } from "../../db/connection.js";

export function isExpiredOrSoon(expiresAtISO, marginMs = 5 * 60 * 1000) {
  if (!expiresAtISO) return true;
  const now = Date.now();
  const exp = new Date(expiresAtISO).getTime();
  return exp - now <= marginMs;
}

export async function refreshTokenRow(tenantId, table = "twitch_tokens") {
  const { rows } = await pool.query(
    `SELECT * FROM ${table} WHERE tenant_id = $1`,
    [tenantId]
  );
  const row = rows[0];
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

  await pool.query(
    `
    UPDATE ${table}
    SET access_token = $1,
        refresh_token = $2,
        access_expires_at = $3,
        scope = $4
    WHERE tenant_id = $5
  `,
    [
      access_token,
      refresh_token,
      newExpiresAt,
      Array.isArray(scope) ? scope.join(" ") : (scope ?? ""),
      tenantId,
    ]
  );

  return access_token;
}
