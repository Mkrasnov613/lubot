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
`db/connection.js` is now one of those modules: it reads `DATABASE_URL` at load and throws if it's
missing, so a boot with no `.env` fails immediately and loudly rather than at the first query.

Client reads `NEXT_PUBLIC_API_URL` (see `client/.env.example`) via `client/src/lib/config.ts`,
which exports **two** bases and they are not interchangeable — always import one of them rather
than hardcoding a server URL or adding a new `fetch` base elsewhere. See "The API proxy" below for
which is which.

## Architecture

**Two independent processes, no shared code.** The client is a pure consumer of the server's HTTP
API and Socket.IO; there's no shared types package. Almost every client data fetch goes through
`config.ts` to `server/backend/routes/` (the one exception is
`client/src/app/api/search/route.ts`, a thin Next.js route that proxies `yt-search`).

**The API proxy.** The browser never talks to the Express server directly. `next.config.ts` rewrites
`/backend/:path*` onto `NEXT_PUBLIC_API_URL`, so browser requests stay on the client's own origin
and the `sid` cookie the server sets is **first-party**. Set directly by the server it would be
host-only to the server's host and invisible to `middleware.ts` and to `cookies()` in Server
Components — and no `Domain=` can bridge them, since `vercel.app` and `onrender.com` are both on
the Public Suffix List. (Locally this was masked for a long time because cookies ignore ports, so
`localhost:3000` and `localhost:5173` share one jar; dev now goes through the proxy too, so that
accident stops hiding the bug.)

Consequences:

- **Browser code uses `API_BASE_URL`** (`"/backend"`, relative). Putting an absolute server URL in
  browser code reintroduces a cross-site cookie, which Safari and Firefox block outright.
- **Server Components and Socket.IO use `SERVER_ORIGIN`** (absolute). Node's `fetch` rejects a
  relative URL, and Vercel rewrites do not proxy WebSocket upgrades. Socket.IO being cross-site is
  harmless: the `/eventsub` namespace does no auth, so its `withCredentials: true` is cosmetic.
- **`TWITCH_REDIRECT_URI` points at the client**, `<client-origin>/backend/auth/twitch/callback`,
  and must be registered on the Twitch app. `TWITCH_BOT_REDIRECT_URI` does *not* — that flow is
  opened directly on the server, so its state cookie is set and read on the same host.
- External rewrites are cached by Vercel by default; `next.config.ts` sends
  `x-vercel-enable-rewrite-caching: 0` on `/backend/*` so one streamer's authenticated response
  can't be served to another.

**Cookie options live in one place.** `utils/session.js` exports `sessionCookieOptions`,
`clearSessionCookieOptions` and `oauthStateCookieOptions` next to the JWT lifetime they have to
agree with. `secure` is derived from whether `FRONTEND_BASE_URL` is `https://` rather than from
`NODE_ENV`, which neither `npm run start` nor the Dockerfile sets. Don't re-inline these options at
a `res.cookie` call site.

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

**Database**: Postgres on [Neon](https://neon.tech) via `pg`, reached through the `DATABASE_URL`
connection string. `server/backend/db/connection.js` exports a `pg` **`Pool`** named `pool` — every
query is `await pool.query(sql, params)` with `$1`-style positional placeholders, returning
`{ rows }` (so a single-row read is `rows[0]`). This used to be SQLite via `better-sqlite3`, whose
API was *synchronous*; if you find a code sample or comment implying a DB call returns a row
directly, it predates the migration.

Two things the remote DB changes that a local file didn't: every query can fail on the network, and
Neon **autosuspends** its compute after a few minutes idle (the next query wakes it, ~300–900 ms).
So fire-and-forget query paths must not be allowed to reject — see the `try`/`continue` around the
sweep query in `utils/tokenScheduler.js`, which runs on a timer with nothing awaiting it.

`connection.js` rewrites `sslmode=require` in the URL to `verify-full` on purpose. `pg` merges a
connection string *over* the explicit config (`Object.assign({}, config, parse(connectionString))`
in its `connection-parameters.js`), so an `ssl:` option passed to the `Pool` is silently ignored
whenever the URL sets `sslmode` — the URL is the only place TLS policy can be set. Don't "fix" this
by adding `ssl: { rejectUnauthorized: false }`; it wouldn't take effect, and Neon's certificate
verifies cleanly.

Schema is owned entirely by `server/backend/db/initDB.js` — `CREATE TABLE IF NOT EXISTS` run once at
boot (now `async`, and `await`ed in `server.js`), no migration framework. Keep it that way: this
file used to have a second, conflicting definition of `lubot_tokens` duplicated in the bot-token
module (different primary key), which only "worked" by import order luck. Don't reintroduce a
`CREATE TABLE` for an existing table outside `initDB.js`.

The token tables store `access_expires_at` as **`TEXT`**, not a timestamp type: every writer stores
`new Date(...).toISOString()` and every reader does `new Date(row.access_expires_at)`, so the ISO
string round-trips verbatim. Only the `created_at` columns, which nothing reads back, are
`TIMESTAMPTZ`.

**Two Neon branches**, in project `lubot-db` (`late-grass-65957101`, eu-central-1, Postgres 18):

| Branch | Endpoint host | Used by |
| --- | --- | --- |
| `production` (default) | `ep-sweet-tree-b2ygifl7-pooler…` | the deployed server |
| `dev` (child of `production`) | `ep-tiny-mouse-b2z9q1v9-pooler…` | local `npm run dev` |

A Neon branch is a copy-on-write clone, so `dev` started as a full copy of production's data and
then diverged. **Nothing in the code selects a branch** — the endpoint host inside `DATABASE_URL`
is the only switch, and both branches share the same role and password, so moving between them is
a hostname swap and nothing else. That also means a `DATABASE_URL` pasted straight from the Neon
dashboard's default view points at `production`; check the host before using it locally, because
the mistake is silent and writes real streamer OAuth tokens.

To refresh `dev` with current production data, reset it from its parent (Neon console → Branches →
`dev` → Reset from parent), which discards local changes. Don't hand-copy rows between branches.

`docs/neon-migration.md` records how the migration was done, including the one-off SQLite→Neon copy
script, if you ever need to redo it for another environment.

`neon.ts` at the repo root is Neon CLI config, not something the server reads. Its branch policy
gives any **new non-default branch a 7-day TTL** — fine for throwaway `neon checkout` branches, but
it means a `dev` branch recreated through the CLI would auto-delete after a week. The current `dev`
was made in the console and has no expiry.

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
