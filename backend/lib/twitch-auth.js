import axios from "axios";
import db from "../db.js";


// compare expiration date and refresh token if necessary   
export async function getValidToken(tenantId) {
  const token = db.prepare(
    `SELECT * FROM twitch_tokens WHERE tenant_id = ?`
  ).get(tenantId);

  if (!token) throw new Error("No token found for this tenant");

  const isExpired = new Date() > new Date(token.access_expires_at);

  if (!isExpired) return token.access_token;

  console.log(`[Twitch] Token expired for tenant ${tenantId}, refreshing...`);

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: token.refresh_token,
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
    UPDATE twitch_tokens
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
    scope: scope?.join(" ") ?? "",
  });

  return access_token;
}
