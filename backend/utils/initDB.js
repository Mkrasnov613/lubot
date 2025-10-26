import db from "../db.js";

export function initDB() {
  const schema = `
  CREATE TABLE IF NOT EXISTS users (
    twitch_user_id TEXT PRIMARY KEY,
    login TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tenants (
    twitch_user_id TEXT PRIMARY KEY,
    slug TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tenant_bot (
    tenant_id TEXT PRIMARY KEY,
    bot_login TEXT,
    bot_display_name TEXT,
    access_token TEXT,
    refresh_token TEXT,
    access_expires_at DATETIME,
    scope TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS memberships (
    tenant_id TEXT,
    user_id TEXT,
    role TEXT CHECK(role IN ('VIEWER','MOD','OWNER')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS twitch_tokens (
    tenant_id TEXT PRIMARY KEY,
    access_token TEXT,
    refresh_token TEXT,
    access_expires_at DATETIME,
    scope TEXT
  );

  CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id TEXT,
    key TEXT,
    value TEXT,
    UNIQUE (tenant_id, key)
  );
  `;

  db.exec(schema);
  console.log("✅ Database initialized");
}
