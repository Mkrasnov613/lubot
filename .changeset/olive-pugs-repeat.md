---
"twitch-music-bot": minor
---

Migrate the database from local SQLite to Neon (serverless Postgres)

The server now talks to Postgres over `pg` using a `DATABASE_URL` connection string instead of
reading `server/data/bot.db` through `better-sqlite3`. `db/connection.js` exports a connection
`pool` and every query is awaited with `$1` positional parameters; existing rows were copied over
so no streamer has to log in again. Drops the `better-sqlite3` dependency, the `./server/data`
Docker volume, and the native build toolchain from the server image.
