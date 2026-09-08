# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LuBot: a self-serve web app + Twitch chat bot. A streamer signs in with Twitch and gets a
configurable bot (moderation, song requests, custom chat commands) plus a web dashboard, without
hosting or coding anything themselves. It's built as a real multi-tenant product — any streamer
can sign up — not a personal tool for one channel.

The gap it targets: existing bots (Nightbot, StreamElements) cover the basics but are shallow —
moderation is little more than a word blacklist, commands are static text with no logic. LuBot's
angle is depth: regex-capable moderation rules with real actions (delete/timeout), commands with
cooldowns and permission levels, and OBS overlays, exposed through the dashboard instead of
requiring custom scripting.

See [MVP.md](MVP.md) for full MVP scope, feature-by-feature decisions, success criteria, and the
milestone plan. That file is the living source of truth for what's in/out of scope — update it
(not this file) when product scope decisions change.

## Repo layout

npm workspaces monorepo, two packages that used to be separate repos (hence the package names not
matching the folders):

- `client/` — Next.js 15 (App Router, Turbopack, React 19, TS, Tailwind v4). `package.json` name:
  `twitch-website-bot`.
- `server/` — Express 5 + Socket.IO, plain Node ESM (no TS, no framework beyond Express).
  `package.json` name: `twitch-music-bot`.

Root `package.json` only wires the workspaces and Changesets scripts — there's no root `dev`/build
command; run each workspace independently (see below).

## Commands

```bash
# client (from client/, or npm run <script> --workspace=client from root)
npm run dev      # next dev --turbopack
npm run build    # next build --turbopack
npm run start    # next start
npm run lint     # eslint

# server (from server/, or --workspace=server from root)
npm run dev      # node --watch backend/server.js
npm run start    # node backend/server.js

# releases (from root)
npm run changeset         # add a changeset
npm run version:packages  # changeset version && npm install
```

There is no test suite in either workspace, and no CI step that verifies the app builds — CI
(`.github/workflows/`) only runs CodeQL and a changeset-presence check. `client/next.config.ts` has
`typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` both set to `true`, so type/lint
errors do not currently fail a build — check `npx tsc --noEmit` and `npm run lint` manually in
`client/` if you want to know whether either is clean.

Docker only packages the server (`docker-compose.yml`, `server/Dockerfile`); the client is meant
to deploy separately (Vercel).

## Environment

One `.env` at the **repo root** (see `.env.example`), not per-workspace. `server/backend/env.js`
loads it and must stay the *first* import in `server/backend/server.js` — ES module imports are
evaluated before any of the importing file's own statements run, so other server modules that read
`process.env` at their own top level (e.g. `lib/botTokens.js`) would otherwise see empty values if
`dotenv.config()` ran later in `server.js` instead of in a dedicated first-imported module. If you
add a new module that reads `process.env` at module load time (not inside a function), this is why
it needs `env.js` to already have run — don't add another scattered `dotenv.config()` call.

Client reads `NEXT_PUBLIC_API_URL` (see `client/.env.example`) via `client/src/lib/config.ts`'s
`API_BASE_URL` — always import that instead of hardcoding a server URL or adding a new `fetch`
base elsewhere.

## Architecture

**Two independent processes, no shared code.** The client is a pure consumer of the server's HTTP
API and Socket.IO; there's no shared types package. Server routes live under
`server/backend/routes/`; almost every client data fetch goes through `API_BASE_URL` to those
routes (the one exception is `client/src/app/api/search/route.ts`, a thin Next.js route that
proxies `yt-search` for the music search overlay).

**Multi-tenancy.** `tenant_id` is the broadcaster's Twitch user ID. The client is tenant-scoped via
the `[slug]` dynamic route (`client/src/app/[slug]/...`); the server resolves the tenant from the
`sid` JWT cookie (`req.user.sid`, set by `utils/session.js` / `middleware/requireAuth.js`), not
from the URL slug — the slug is just for routing/display. Nearly every DB table and the Socket.IO
room naming (`tenant:{tenantId}`, see `lib/player.js`) is scoped by this tenant ID.

**Session lifetime.** The `sid` cookie's `maxAge` and the JWT's own `expiresIn` (`utils/session.js`)
are set independently and must be kept in sync — `requireAuth.js` re-signs (sliding refresh) the
JWT with the same `expiresIn` on every authenticated request, but if the JWT's `expiresIn` is
shorter than the cookie's `maxAge`, a session that goes quiet for longer than the JWT lifetime
fails `jwt.verify` (`"invalid or expired session"`, 401) even though the cookie is still present
and within its own `maxAge`. Client server-components that fetch authenticated routes should treat
a 401 as "session expired" and `redirect("/")` (matching `middleware.ts`'s unauthenticated target)
rather than throwing — see `ActivityFeedComponent.tsx` for the pattern; `TwitchChannelComponent.tsx`
instead degrades quietly via optional chaining since its data is non-critical for rendering.

**Two separate Twitch OAuth flows**, both under `server/backend/routes/`:
- `auth-twitch-broadcaster.js` — the streamer logging into their own dashboard. On success this
  also calls `startEventSub()` and `enableBot()` for that tenant. Requests scopes as a single
  space-separated string; adding a scope here means every already-logged-in streamer must log in
  again before calls needing that scope work for them — Twitch won't retroactively grant it to an
  existing token, and `refreshTokenRow`'s refresh-token grant doesn't expand scope either.
- `auth-twitch-bot.js` — authorizing the bot's own Twitch account. There is currently **one shared
  bot account** for every tenant (`lubot_tokens` table, single row with `id = 'global'`), not a
  bot-per-tenant model. `server/backend/lib/botTokens.js` owns reading/refreshing that token.

**Twitch Helix API calls that need `moderator_id`** (chat settings, AutoMod, Shield Mode, blocked
terms, chat-message deletion) use the broadcaster as its own moderator — `moderator_id` is passed
as the same value as `broadcaster_id`, authenticated with the broadcaster's own token
(`refreshTokenRow(tenantId)`), not the shared bot account's token. See the delete-message call in
`lib/botManager.js` for the existing precedent; there's no bot-as-moderator identity plumbed in
anywhere despite the bot fetching its own token in `enableBot()` (that token is only used for the
`tmi.js` IRC connection, never for Helix calls).

**Chat bot** (`lib/botManager.js`): one `tmi.Client` per tenant, held in an in-memory `Map` keyed
by `tenantId`. Nuke-word rules are cached in-memory per broadcaster and invalidated on CRUD via
`invalidateNukeCache()`. `/api/bot/enable|disable|status` (routes/api/bot.js) control this map;
`BotConnectionWindow.tsx` on the client is the UI for it.

**EventSub** (`lib/eventSub.js`): a raw WebSocket client (not `tmi.js`) per tenant against Twitch's
EventSub, forwarding `stream.online`/`channel.follow` notifications into the `/eventsub` Socket.IO
namespace, which `useEventSub.ts` / `LiveEventFeed.tsx` consume for the live dashboard activity
feed.

**Song queue** (`lib/player.js`): per-tenant queue state lives in an in-memory `Map` on the server
process — it is **not** persisted, so a server restart loses every tenant's queue. Realtime sync to
clients is via the default Socket.IO namespace (join `tenant:{tenantId}` on connect).

**Database**: SQLite via `better-sqlite3`, one file (`server/data/bot.db`). Schema is owned
entirely by `server/backend/utils/initDB.js` — `CREATE TABLE IF NOT EXISTS` run once at boot, no
migration framework. Keep it that way: this file used to have a second, conflicting definition of
`lubot_tokens` duplicated in `botTokens.js` (different primary key), which only "worked" by import
order luck. Don't reintroduce a `CREATE TABLE` for an existing table anywhere outside `initDB.js`.
