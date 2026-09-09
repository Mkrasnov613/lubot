# Migrating LuBot's database to Neon

> **Status: done.** This migration has been carried out on the `dev` branch. The steps below are
> kept as the record of what changed and why — useful if you need to stand up another environment
> (a staging Neon branch, a fresh clone) or to understand a decision after the fact.

**Goal:** move the server off local SQLite (`better-sqlite3`, `server/data/bot.db`) and onto
[Neon](https://neon.tech) — serverless Postgres. After this you no longer ship a database file,
the `./server/data` Docker volume goes away, and the DB is a managed service reachable by a
connection string.

## What Neon is (30-second version)

- Managed Postgres, hosted. You get a **project** → a **branch** (`main`) → a **database**
  (`neondb`) → a **role** (user). You connect with a normal Postgres connection string.
- "Serverless" means the compute **autosuspends** when idle (free tier: ~5 min) and wakes on the
  next query (~300–900 ms cold start). For LuBot this is invisible — the token scheduler queries
  every 10 min anyway.
- It offers Git-style **branching** (a cheap copy-on-write clone of your data) — handy for keeping
  local-dev data separate from production.
- Free tier is plenty for LuBot's five small tables.

## The one hard part

`better-sqlite3` is **synchronous** (`db.prepare(sql).get()` returns a row immediately).
Every Postgres driver is **asynchronous** (returns a Promise). So the migration is mostly:
mechanically turning ~10 query call sites into `await`, and swapping SQLite SQL dialect for
Postgres. There are only 6 files that touch the DB, so this is an afternoon, not a week.

Driver choice: use **`pg`** (node-postgres). LuBot's server is a long-running process (Express +
Socket.IO), so a normal TCP connection pool is the right fit and the most portable option.
(`@neondatabase/serverless` is for edge/serverless-function runtimes — not needed here.)

---

## Part 1 — Create the Neon project

1. Go to <https://neon.tech> and sign up (GitHub login works).
2. **Create a project.** Pick the region closest to wherever the server runs (your VPS / Docker
   host, *not* your laptop). Leave Postgres version at the default.
3. Neon provisions a branch `main`, a database `neondb`, and a role `neondb_owner`.
4. On the project dashboard, find the **Connection string** widget. Turn **Connection pooling
   ON** and copy the string — the host will contain `-pooler`. It looks like:

   ```
   postgresql://neondb_owner:npg_xxxxxxxx@ep-cool-name-12345-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

5. (Optional but recommended) Create a second branch called `dev` from the dashboard
   ("Branches" → "New branch"). Use its connection string in your **local** `.env`, and the
   `main` branch string in production. Now local testing never touches real streamer tokens.

**Pooled vs direct string:** use the **pooled** one (`-pooler`) for the app. Keep the direct
(non-pooler) string around only for `pg_dump` / schema tools that dislike PgBouncer.
`initDB`'s `CREATE TABLE IF NOT EXISTS` works fine through the pooler.

---

## Part 2 — Add the driver

From the repo root:

```bash
npm install pg --workspace=server
# keep better-sqlite3 for now — the migration script in Part 6 still needs it
```

---

## Part 3 — Rewrite the connection module

Replace `server/backend/db/connection.js` entirely. See the file in the repo for the shipped
version; the shape is:

```js
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set …");
}

export const pool = new Pool({
  connectionString: pinSslMode(process.env.DATABASE_URL),
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => console.error("Postgres pool error:", err.message));
```

Two non-obvious details, both verified against the installed `pg` 8.23:

**Don't pass an `ssl` option to the `Pool`.** `pg`'s `connection-parameters.js` does
`config = Object.assign({}, config, parse(config.connectionString))` — the *parsed connection
string wins over your explicit config*. Since Neon's URL carries `sslmode=require`, any
`ssl: { … }` you pass to the `Pool` is silently discarded. The URL is the only lever. (An earlier
draft of this guide suggested `ssl: { rejectUnauthorized: false }`; that would have been both
inert and, had it worked, a needless downgrade — Neon's certificate verifies cleanly under full
verification.)

**`sslmode=require` is pinned to `verify-full` in code.** `pg` currently treats `require` as full
verification but warns that in v9 it will adopt libpq semantics, where `require` means *encrypt but
don't verify the certificate*. `pinSslMode()` rewrites `require`/`prefer`/`verify-ca` to
`verify-full` so that upgrade can't silently stop checking Neon's identity, and so a freshly pasted
Neon URL is safe by default. It leaves `disable`/`no-verify` alone — those are deliberate opt-outs.

**The `pool.on("error")` listener is not optional.** Neon autosuspends after a few minutes idle,
which drops pooled connections. Without a listener that surfaces as an unhandled `'error'` event
and kills the process.

The module reads `process.env` at load, so — exactly as `CLAUDE.md` describes for
`utils/tokens/bot.js` — it depends on `server/backend/env.js` having run first. It does:
`server.js` imports `./env.js` on line 1, before anything that pulls in `connection.js`.

> The old export was named `db`; the new one is `pool`. Renaming it (rather than aliasing)
> forces your eyes onto every call site that needs converting.

---

## Part 4 — Port the schema (`initDB.js`)

Postgres dialect differences that matter here:

| SQLite | Postgres |
| --- | --- |
| `DATETIME DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMPTZ DEFAULT now()` |
| `id INTEGER PRIMARY KEY` (autoincrement) | `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| `ON CONFLICT(col) DO UPDATE SET x = excluded.x` | **identical** — no change needed |

`access_expires_at` is left as `TEXT` on purpose: the code writes `new Date(...).toISOString()`
and reads with `new Date(...)`, so storing the ISO string verbatim avoids any timezone-parsing
surprise. Only `created_at` columns become real timestamps.

New `server/backend/db/initDB.js`:

```js
import { pool } from "./connection.js";

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      twitch_user_id TEXT PRIMARY KEY,
      login TEXT,
      display_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS tenants (
      twitch_user_id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      display_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- id is always the literal string 'global': one shared bot account for
    -- the whole deployment (see utils/tokens/bot.js), not one row per tenant.
    CREATE TABLE IF NOT EXISTS lubot_tokens (
      id TEXT PRIMARY KEY,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      access_expires_at TEXT NOT NULL,
      scope TEXT
    );

    CREATE TABLE IF NOT EXISTS nuke_words (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      broadcaster_id TEXT NOT NULL,
      word TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_nuke_words_broadcaster
      ON nuke_words (broadcaster_id);

    CREATE TABLE IF NOT EXISTS twitch_tokens (
      tenant_id TEXT PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      access_expires_at TEXT,
      scope TEXT
    );
  `);
  console.log("✅ Database initialized (Neon / Postgres)");
}
```

`pg` runs a multi-statement string in one `query()` call as long as there are no bind params — so
this stays a single call.

In `server/backend/server.js`, line 49 becomes `await`:

```js
await initDB();
```

Top-level `await` is fine in an ES module entry point, and everything after it (routes, the
scheduler) legitimately depends on the tables existing.

---

## Part 5 — Convert the query call sites

Pattern for the whole codebase:

| better-sqlite3 | pg |
| --- | --- |
| `db.prepare(sql).get(a, b)` | `(await pool.query(sql, [a, b])).rows[0]` |
| `db.prepare(sql).all(a)` | `(await pool.query(sql, [a])).rows` |
| `db.prepare(sql).run({...})` | `await pool.query(sql, [...])` |
| `?` placeholders | `$1`, `$2`, … (positional, 1-based) |
| `@name` named placeholders | `$1`, `$2`, … — pg has no named params; convert to positional |

### 5a. `server/backend/routes/api/data-tenant.js`

Make the handler `async` and await the two lookups:

```js
import { pool } from "../../db/connection.js";

dataTenantRouter.get("/tenant", requireAuth, async (req, res) => {
  const query = req.query.data;
  const twitchUserID = req.user.sid;

  if (query === "tenant_id") return res.send(twitchUserID);

  if (query === "slug") {
    const { rows } = await pool.query(
      `SELECT slug FROM tenants WHERE twitch_user_id = $1`,
      [twitchUserID],
    );
    return res.send(rows[0]);
  }

  if (query === "avatar_url") {
    const { rows } = await pool.query(
      `SELECT avatar_url FROM tenants WHERE twitch_user_id = $1`,
      [twitchUserID],
    );
    return res.send(rows[0]);
  }

  return res.status(400).json({ error: "Unsupported data query" });
});
```

`rows[0]` is `{ slug: "..." }` or `undefined`, same shape better-sqlite3 returned, so the client
sees no change.

As shipped, the two branches were folded into a small `{ slug, avatar_url }` allowlist so the
`try`/`catch` (a DB call can now fail on the network — it must not become an unhandled rejection
inside an Express handler) isn't written twice. The allowlist is what makes interpolating the
column name into the SQL safe.

### 5b. `server/backend/routes/auth/broadcaster.js`

Already an `async` handler inside `try/catch`. Convert the three `db.prepare(...).run({...})`
blocks (lines ~95, ~114, ~133) to positional params:

```js
// users
await pool.query(
  `INSERT INTO users (twitch_user_id, login, display_name, avatar_url)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (twitch_user_id) DO UPDATE SET
     login = excluded.login,
     display_name = excluded.display_name,
     avatar_url = excluded.avatar_url`,
  [user.id, user.login, user.display_name, user.profile_image_url ?? null],
);

// twitch_tokens
const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
await pool.query(
  `INSERT INTO twitch_tokens (tenant_id, access_token, refresh_token, access_expires_at, scope)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (tenant_id) DO UPDATE SET
     access_token = excluded.access_token,
     refresh_token = excluded.refresh_token,
     access_expires_at = excluded.access_expires_at,
     scope = excluded.scope`,
  [user.id, access_token, refresh_token, expiresAt, ""],
);

// tenants
await pool.query(
  `INSERT INTO tenants (twitch_user_id, slug, display_name, avatar_url)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (twitch_user_id) DO UPDATE SET
     slug = excluded.slug,
     display_name = excluded.display_name,
     avatar_url = excluded.avatar_url`,
  [user.id, user.login, user.display_name, user.profile_image_url ?? null],
);
```

(Optional improvement: these three writes belong together, so wrap them in a transaction —
`const client = await pool.connect(); try { await client.query("BEGIN"); …; await client.query("COMMIT") } catch { await client.query("ROLLBACK"); throw } finally { client.release() }`.
Not required for correctness.)

### 5c. `server/backend/services/botManager.js`

The two helpers become `async`:

```js
async function getTenantLogin(tenantId) {
  const { rows } = await pool.query(
    `SELECT slug FROM tenants WHERE twitch_user_id = $1`,
    [tenantId],
  );
  return rows[0];
}

async function getBroadcasterLoginFallback(tenantId) {
  const { rows } = await pool.query(
    `SELECT login FROM users WHERE twitch_user_id = $1`,
    [tenantId],
  );
  return rows[0];
}
```

And in `enableBot` (already `async`):

```js
const tenant = await getTenantLogin(tenantId);
const broadcaster = await getBroadcasterLoginFallback(tenantId);
```

### 5d. `server/backend/utils/tokens/bot.js`

```js
import { pool } from "../../db/connection.js";

export async function getBotRow() {
  const { rows } = await pool.query(`SELECT * FROM lubot_tokens WHERE id = 'global'`);
  return rows[0];
}

export async function saveBotRow({ access_token, refresh_token, expires_in, scope }) {
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
  await pool.query(
    `INSERT INTO lubot_tokens (id, access_token, refresh_token, access_expires_at, scope)
     VALUES ('global', $1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       access_expires_at = excluded.access_expires_at,
       scope = excluded.scope`,
    [
      access_token,
      refresh_token,
      expiresAt,
      Array.isArray(scope) ? scope.join(" ") : String(scope ?? ""),
    ],
  );
}
```

In `getBotAccessToken` (already `async`): `let row = await getBotRow();`

### 5e. `server/backend/utils/tokens/broadcaster.js`

`refreshTokenRow` is already `async`. The `${table}` interpolation stays (unchanged footgun,
same as today — the only callers pass the default):

```js
import { pool } from "../../db/connection.js";

export async function refreshTokenRow(tenantId, table = "twitch_tokens") {
  const { rows } = await pool.query(
    `SELECT * FROM ${table} WHERE tenant_id = $1`,
    [tenantId],
  );
  const row = rows[0];
  if (!row) throw new Error(`No token row in ${table} for tenant ${tenantId}`);

  if (!isExpiredOrSoon(row.access_expires_at)) return row.access_token;

  // ... unchanged axios refresh call ...

  const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
  await pool.query(
    `UPDATE ${table}
        SET access_token = $1,
            refresh_token = $2,
            access_expires_at = $3,
            scope = $4
      WHERE tenant_id = $5`,
    [
      access_token,
      refresh_token,
      newExpiresAt,
      Array.isArray(scope) ? scope.join(" ") : (scope ?? ""),
      tenantId,
    ],
  );

  return access_token;
}
```

### 5f. `server/backend/utils/tokenScheduler.js`

`sweep` is already `async` — but nothing awaits it (it runs via `setInterval` and one bare call at
startup). Under SQLite that read couldn't realistically throw; against Neon it can, and an
unhandled rejection takes the whole server down in Node 18+. So the query needs its own guard:

```js
import { pool } from "../db/connection.js";

let rows;
try {
  ({ rows } = await pool.query(
    `SELECT tenant_id, access_expires_at FROM ${table}`,
  ));
} catch (e) {
  console.error(`[OAuth] Could not read ${table}:`, e.message);
  continue;
}
for (const r of rows) {
  // ... unchanged: per-tenant refresh errors were already caught ...
}
```

This is the one place the migration changes runtime behaviour rather than just syntax, and it's
worth grepping for the general pattern — *any* fire-and-forget `async` function that now touches
the DB needs the same treatment.

### Grep to confirm you got them all

```bash
grep -rn "\.prepare(\|better-sqlite3\|db/connection\|\bdb\." server/backend --include=*.js
```

Only `connection.js`, `initDB.js`, and (temporarily) the migration script should mention
`better-sqlite3` when you're done.

---

## Part 6 — Move existing data over

The tables are tiny, but the token rows matter (losing them logs every streamer out). One-off
script — create `server/backend/db/migrate-sqlite-to-neon.js`:

```js
import "../env.js";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./connection.js";
import { initDB } from "./initDB.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlite = new Database(path.join(__dirname, "../../data/bot.db"), { readonly: true });

await initDB(); // create the tables on Neon first

// nuke_words: skip `id`, let the identity column regenerate
const tables = {
  users: ["twitch_user_id", "login", "display_name", "avatar_url", "created_at"],
  tenants: ["twitch_user_id", "slug", "display_name", "avatar_url", "created_at"],
  lubot_tokens: ["id", "access_token", "refresh_token", "access_expires_at", "scope"],
  twitch_tokens: ["tenant_id", "access_token", "refresh_token", "access_expires_at", "scope"],
  nuke_words: ["broadcaster_id", "word", "created_at"],
};

for (const [table, cols] of Object.entries(tables)) {
  const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
  for (const row of rows) {
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    await pool.query(
      `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})
       ON CONFLICT DO NOTHING`,
      cols.map((c) => row[c] ?? null),
    );
  }
  console.log(`  ${rows.length} rows → ${table}`);
}

sqlite.close();
await pool.end();
console.log("✅ migration complete");
```

Run it once, from `server/`:

```bash
node backend/db/migrate-sqlite-to-neon.js
```

Verify in the Neon dashboard's **SQL Editor**: `SELECT count(*) FROM twitch_tokens;` etc.
Then delete the script (or keep it in `docs/` for reference).

---

## Part 7 — Env + Docker

**`.env`** (repo root) and **`.env.example`** — add:

```ini
# --- Database (Neon serverless Postgres) ---
# Pooled connection string from the Neon dashboard (host contains "-pooler").
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
```

**`docker-compose.yml`:**

- Add `- DATABASE_URL=${DATABASE_URL}` under `environment:`.
- Delete the volume mount — there's no local DB file anymore:
  ```yaml
  volumes:
    - ./server/data:/app/server/data   # ← remove this
  ```

**`server/Dockerfile`:**

- Once `better-sqlite3` is removed (below), drop the native-build toolchain:
  ```dockerfile
  RUN apk add --no-cache python3 make g++ sqlite   # ← remove
  ```
- `RUN mkdir -p /app/server/data` can go too.

**Remove the old driver** (after Part 6 succeeds):

```bash
npm remove better-sqlite3 --workspace=server
```

---

## Part 8 — Test

```bash
# from server/
npm run dev
```

- Boot log should show `✅ Database initialized (Neon / Postgres)` and no errors.
- Do the broadcaster OAuth login end-to-end → confirm rows land in `users`, `tenants`,
  `twitch_tokens` (Neon SQL Editor).
- Confirm the bot connects (`✅ LuBot connected for tenant=…`) — that exercises
  `getBotAccessToken` → `lubot_tokens`.
- Hit `GET /api/data/tenant?data=slug` with a valid `sid` cookie → returns `{"slug":"…"}`.
- Leave it running >10 min → token scheduler sweep logs no errors (exercises
  `tokenScheduler` + `refreshTokenRow`).

---

## Part 9 — Update the docs

In `CLAUDE.md`:

- **Database** section: replace the SQLite / `better-sqlite3` / `bot.db` / WAL description with
  Neon Postgres via `pg`, schema still owned by `initDB.js` (now `async`, `CREATE TABLE IF NOT
  EXISTS` unchanged in spirit).
- **Environment** section: add `DATABASE_URL`, and note `connection.js` now reads it at module
  load (another reason `env.js` must stay first).
- Drop any implication that DB calls are synchronous.

---

## Neon gotchas worth knowing

- **Autosuspend cold start:** first query after idle lags ~300–900 ms on the free tier. If that
  ever bothers you, it's a paid "always-on" toggle — no code change.
- **Connection limits:** the pooler multiplexes, so `max: 10` in the Pool is comfortable. Don't
  crank it up.
- **Migrations:** there's still no migration framework, by design (`CLAUDE.md`). If the schema
  starts changing often, revisit — Neon branching makes testing a migration safe, but you'd want
  a tool like `node-pg-migrate` rather than hand-editing `initDB.js`.
- **Backups:** Neon keeps point-in-time restore history (7 days on free). You can also
  `pg_dump "$DATABASE_URL"` on a cron for your own copy.
- **`sslmode` must stay in the URL.** Neon rejects plaintext connections, and per Part 3 the URL is
  the only place TLS policy has any effect.
- **The old `server/data/bot.db` is left in place** as a backup. It's covered by `server/.gitignore`
  (`*.db`), so the live OAuth tokens in it were never committed. Delete it once you're satisfied
  the Neon copy is good.
