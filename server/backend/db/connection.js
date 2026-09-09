import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set — copy the pooled connection string from the Neon dashboard into the root .env",
  );
}

// pg lets the connection string override any `ssl` option passed to the Pool
// (connection-parameters.js does `Object.assign({}, config, parse(connectionString))`),
// so the URL is the only place TLS policy can actually be set. Neon hands out
// `sslmode=require`, which pg treats as full verification today but will
// downgrade to *unverified* in pg v9 — pin it to verify-full so that upgrade
// can't silently stop checking Neon's certificate. `disable`/`no-verify` are
// left alone: nobody types those by accident.
function pinSslMode(url) {
  if (/[?&]sslmode=/i.test(url)) {
    return url.replace(/([?&]sslmode=)(require|prefer|verify-ca)\b/i, "$1verify-full");
  }
  return `${url}${url.includes("?") ? "&" : "?"}sslmode=verify-full`;
}

export const pool = new Pool({
  connectionString: pinSslMode(process.env.DATABASE_URL),
  max: 10,
  idleTimeoutMillis: 30_000,
});

// Neon autosuspends its compute after a few minutes of inactivity, which drops
// idle pooled connections. Without a listener that surfaces as an unhandled
// 'error' event and kills the process; pg discards the dead client and
// reconnects on the next query, so logging is the whole job here.
pool.on("error", (err) => console.error("Postgres pool error:", err.message));
