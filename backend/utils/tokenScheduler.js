import { db } from "../db.js";
import { refreshTokenRow, isExpiredOrSoon } from "../lib/twitchTokens.js";

const TABLES = ["twitch_tokens"]; 

export function startTokenScheduler({
  intervalMs = 10 * 60 * 1000, // every 10 min
  marginMs = 5 * 60 * 1000,    // refresh if expiring within 5 min
} = {}) {
  async function sweep() {
    for (const table of TABLES) {
      const rows = db.prepare(`SELECT tenant_id, access_expires_at FROM ${table}`).all();
      for (const r of rows) {
        if (isExpiredOrSoon(r.access_expires_at, marginMs)) {
          try {
            await refreshTokenRow(r.tenant_id, table);
            console.log(`[OAuth] Refreshed ${table} for tenant ${r.tenant_id}`);
          } catch (e) {
            console.error(`[OAuth] Refresh failed for ${table}/${r.tenant_id}:`, e.message);
          }
        }
      }
    }
  }

  sweep();
  const timer = setInterval(sweep, intervalMs);
  console.log(`[OAuth] Token scheduler started (every ${intervalMs / 60000} min)`);
  return () => clearInterval(timer);
}
