import { pool } from "./connection.js";

export async function initDB() {
  // `access_expires_at` stays TEXT on purpose: every writer stores
  // `new Date(...).toISOString()` and every reader does `new Date(row.…)`, so
  // round-tripping the ISO string verbatim avoids a timezone-parsing change.
  // Only the `created_at` columns, which nothing reads back, become timestamps.
  const schema = `
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
  `;

  await pool.query(schema);
  console.log("✅ Database initialized");
}
