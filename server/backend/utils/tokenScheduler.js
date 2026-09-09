import { pool } from "../db/connection.js";
import { refreshTokenRow, isExpiredOrSoon } from "./tokens/broadcaster.js";

const TABLES = ["twitch_tokens"]; 

export function startTokenScheduler({
  intervalMs = 10 * 60 * 1000, // every 10 min
  marginMs = 5 * 60 * 1000,    // refresh if expiring within 5 min
} = {}) {
  // Nothing awaits sweep() — it runs on a timer — so it must never reject.
  // Reading the token table is a network call now that the DB is remote, and an
  // unhandled rejection here would take the whole server down.
  async function sweep() {
    for (const table of TABLES) {
      let rows;
      try {
        ({ rows } = await pool.query(
          `SELECT tenant_id, access_expires_at FROM ${table}`
        ));
      } catch (e) {
        console.error(`[OAuth] Could not read ${table}:`, e.message);
        continue;
      }
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
