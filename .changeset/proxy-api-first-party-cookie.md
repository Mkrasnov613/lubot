---
"twitch-website-bot": patch
"twitch-music-bot": patch
---

Fix login bouncing back to the home page in production.

The `sid` cookie was set by the API server on its own host (Render) and read by
Next.js middleware on the client's host (Vercel), where it never existed — so
every authenticated route redirected to `/`. `Domain=` can't bridge the two:
`vercel.app` and `onrender.com` are both on the Public Suffix List. It only
worked locally because cookies ignore ports, so `localhost:3000` and
`localhost:5173` share one cookie jar.

The browser now reaches the API through a `/backend/:path*` rewrite on the
client's own origin, making the session cookie first-party. This also fixes the
authenticated browser fetches, which were third-party cookie sends already
blocked by Safari and Firefox. Server Components and Socket.IO keep using the
absolute server origin (`SERVER_ORIGIN`), since neither can go through the
rewrite.

Session and OAuth-state cookie options are now defined once in
`utils/session.js`, alongside the JWT lifetime they must stay in sync with, and
`SameSite` drops from `none` to `lax` now that the cookie is first-party.
