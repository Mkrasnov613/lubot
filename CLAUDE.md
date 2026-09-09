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

## Current state: mid-rebuild

A large amount of behaviour was deliberately deleted and has not been rebuilt. Read this before
concluding something is broken or missing:

- **The chat bot does nothing but connect.** `server/backend/services/botManager.js` handles
  connection lifecycle only — it joins the tenant's channel over IRC and nothing else. Its header
  comment says moderation, nuke words and song commands were removed pending a redesign; don't add
  message handling back without revisiting that.
- **The song queue is gone entirely** — no `player.js`, no queue tables, no Socket.IO room
  fan-out. `/[slug]/music` and `/[slug]/bot` are placeholder pages.
- **`nuke_words` still exists in the schema but no code reads it.** Leftover from the removed
  moderation; the table is created at boot and never queried.
- **`disableBot()` is exported but unreachable** — there is no `/api/bot/*` route. `enableBot()`
  and `startEventSub()` are called from exactly one place: the broadcaster OAuth callback.

## Repo layout

npm workspaces monorepo, two packages that used to be separate repos (hence the package names not
matching the folders):

- `client/` — Next.js 15 (App Router, React 19, TS, Chakra UI v3). `package.json` name:
  `twitch-website-bot`.
- `server/` — Express 5 + Socket.IO, plain Node ESM (no TS, no framework beyond Express).
  `package.json` name: `twitch-music-bot`. Source lives under `server/backend/`, split into
  `routes/{api,auth}/`, `services/`, `utils/`, `middleware/`, and `db/`.

Root `package.json` only wires the workspaces and Changesets scripts — there's no root `dev`/build
command; run each workspace independently.

## Commands

```bash
# client (from client/, or npm run <script> --workspace=client from root)
npm run dev      # next dev -p 5173
npm run build    # next build
npm run start    # next start
npm run lint     # eslint

# server (from server/, or --workspace=server from root)
npm run dev      # node --watch backend/server.js  → listens on hardcoded port 3000
npm run start    # node backend/server.js

# releases (from root)
npm run changeset         # add a changeset
npm run version:packages  # changeset version && npm install
npm run tag:release       # changeset tag
```

The client dev port (5173) is not incidental: the server's CORS allowlist hardcodes
`http://localhost:5173`, and both Twitch embeds hardcode `parent=localhost`. Running the client on
another port breaks API calls; deploying it to a real domain will break the embeds until that
`parent` value is made configurable.

**Do not add `--turbopack`.** `client/next.config.ts` documents that Turbopack breaks Chakra/Emotion's
SSR output, so the webpack build is required. `yt-search` and `cheerio` are also pinned as
`serverExternalPackages` there because webpack can't bundle them correctly.

There is no test suite in either workspace. `next.config.ts` sets `typescript.ignoreBuildErrors`
and `eslint.ignoreDuringBuilds` to `true`, so type and lint errors do **not** fail a build — run
`npx tsc --noEmit` and `npm run lint` in `client/` manually. Note that a green typecheck is not a
green build: Chakra's polymorphic `as` prop and factory components can typecheck and still throw
at prerender, so run `npm run build` before claiming a UI change works.

CI (`.github/workflows/`) runs a client build, CodeQL, a changeset-presence check, and two Claude
Code workflows. Docker only packages the server (`docker-compose.yml`, `server/Dockerfile`); the
client deploys separately (Vercel).

## Environment

One `.env` at the **repo root** (see `.env.example`), not per-workspace. `server/backend/env.js`
loads it and must stay the *first* import in `server/backend/server.js` — ES module imports are
evaluated before any of the importing file's own statements run, so other server modules that read
`process.env` at their own top level (e.g. `utils/tokens/bot.js`) would otherwise see empty values
if `dotenv.config()` ran later in `server.js` instead of in a dedicated first-imported module. If
you add a new module that reads `process.env` at module load time (not inside a function), this is
why it needs `env.js` to already have run — don't add another scattered `dotenv.config()` call.

Client reads `NEXT_PUBLIC_API_URL` (see `client/.env.example`) via `client/src/lib/config.ts`'s
`API_BASE_URL` — always import that instead of hardcoding a server URL or adding a new `fetch`
base elsewhere.

## Architecture

**Two independent processes, no shared code.** The client is a pure consumer of the server's HTTP
API and Socket.IO; there's no shared types package. Almost every client data fetch goes through
`API_BASE_URL` to `server/backend/routes/` (the one exception is
`client/src/app/api/search/route.ts`, a thin Next.js route that proxies `yt-search`).

**Multi-tenancy.** `tenant_id` is the broadcaster's Twitch user ID. The client is tenant-scoped via
the `[slug]` dynamic route (`client/src/app/[slug]/...`); the server resolves the tenant from the
`sid` JWT cookie (`req.user.sid`, set by `utils/session.js` / `middleware/requireAuth.js`), not
from the URL slug — the slug is just for routing/display.

**Session lifetime.** The `sid` cookie's `maxAge` (`requireAuth.js`) and the JWT's own `expiresIn`
(`utils/session.js`) are set independently and must be kept in sync — both are currently 7 days.
`requireAuth` re-signs the JWT (sliding refresh) on every authenticated request, but if the JWT's
`expiresIn` is ever made shorter than the cookie's `maxAge`, a session that goes quiet for longer
than the JWT lifetime fails `jwt.verify` (`"invalid or expired session"`, 401) even though the
cookie is still present and within its own `maxAge`. Client server-components that fetch
authenticated routes should treat a 401 as "session expired" and `redirect("/")` (matching
`middleware.ts`'s unauthenticated target) rather than throwing — see `ActivityFeedComponent.tsx`
and `TwitchChannelComponent.tsx`. Only the primary fetch on a page needs that check; secondary
fetches for non-critical data (the game box art) are read through optional chaining so a failure
renders a placeholder instead of taking the page down.

**Two separate Twitch OAuth flows**, under `server/backend/routes/auth/`:
- `broadcaster.js` — the streamer logging into their own dashboard. On success this also calls
  `startEventSub()` and `enableBot()` for that tenant, so those are the *only* things that start
  them; a server restart leaves every tenant without an EventSub socket or a chat connection until
  they log in again. Requests scopes as a single space-separated string; adding a scope here means
  every already-logged-in streamer must log in again before calls needing it work for them —
  Twitch won't retroactively grant it, and `refreshTokenRow`'s refresh-token grant doesn't expand
  scope either.
- `bot.js` — authorizing the bot's own Twitch account. There is **one shared bot account** for
  every tenant (`lubot_tokens` table, single row with `id = 'global'`, IRC username hardcoded as
  `lutikbot` in `botManager.js`), not a bot-per-tenant model.
  `server/backend/utils/tokens/bot.js` owns reading/refreshing that token.

**Token refresh.** `refreshTokenRow(tenantId, table = "twitch_tokens")` in
`utils/tokens/broadcaster.js` returns a valid access token, refreshing in place if it's near
expiry. Its second parameter is a **table name interpolated into SQL** — passing anything else
(e.g. a client id) produces `SELECT ... FROM <that value>` and throws. `startTokenScheduler()`
refreshes tokens on a timer at boot.

**Twitch Helix calls that need `moderator_id`** use the broadcaster as its own moderator —
`moderator_id` is passed as the same value as `broadcaster_id`, authenticated with the
broadcaster's own token, not the shared bot account's. The bot's token is only used for the
`tmi.js` IRC connection, never for Helix calls.

**EventSub** (`services/eventSub.js`): a raw WebSocket client (not `tmi.js`) per tenant against
Twitch's EventSub, forwarding notifications into the `/eventsub` Socket.IO namespace, which
`LiveEventFeed.tsx` and `TallyLight.tsx` consume. It subscribes to exactly two types:
**`stream.online` and `channel.follow` v2**. The client has handlers for `channel.subscribe` and
`stream.offline` that can never fire, because nothing subscribes to them — subs appear in the feed
only via the initial `/api/twitch/followers` fetch, and going offline needs a page reload. Adding
either one means adding a `createSub` call server-side first.

**Database**: SQLite via `better-sqlite3`, one file (`server/data/bot.db`), WAL mode. Schema is
owned entirely by `server/backend/db/initDB.js` — `CREATE TABLE IF NOT EXISTS` run once at boot,
no migration framework. Keep it that way: this file used to have a second, conflicting definition
of `lubot_tokens` duplicated in the bot-token module (different primary key), which only "worked"
by import order luck. Don't reintroduce a `CREATE TABLE` for an existing table outside `initDB.js`.

## Client design system — "Console"

Dark-theme only, deliberately. A light theme and a theme toggle were built and then removed at the
user's request; don't reintroduce `light-dark()` tokens, a `ThemeContext`, or a toggle unless
asked.

Colour and type live as CSS custom properties in `client/src/app/globals.css`, which is the single
source of truth. `client/src/lib/chakra/system.ts` maps Chakra tokens onto those variables rather
than duplicating values. Components should name a Chakra token (`chassis`, `inset`, `engrave`,
`signal`, `tally`…); drop to a raw `var(--color-*)` only for inline styles Chakra can't express,
and never hardcode a hex.

The four rules the system rests on are documented at the top of `globals.css`: the accent is light
rather than paint (violet appears as lit edges, focus rings and selected state, not large fills);
red is reserved for the on-air tally so red means exactly one thing; depth comes from value steps
and lit edges, not drop shadows; and the mono face is for machine syntax (commands, regex, URLs,
ticking numbers) and never for labels. `components/Panel.tsx` is the structural primitive.

Two gotchas:

- **Chakra typegen writes into `node_modules`.** After changing recipes or tokens in `system.ts`,
  run `npx @chakra-ui/cli typegen src/lib/chakra/system.ts` from `client/`, or a new recipe variant
  will fail typecheck against stale generated types. `npm install` wipes it; re-run then too.
- **Chakra reserves `bg` / `fg` / `border`** as its own semantic tokens with light/dark-conditional
  values, and its preflight applies them to `html`. Ours override them unconditionally under
  `theme.semanticTokens`; declaring them under `theme.tokens` instead collides in name only and
  loses, which silently reverts the app to Chakra's white-background light default.
