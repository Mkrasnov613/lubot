import jwt from "jsonwebtoken";

const JWT = process.env.JSON_WEB_TOKEN;

// The cookie's maxAge and the JWT's own expiresIn must stay in sync: if the JWT
// expires first, a session that goes quiet fails jwt.verify ("invalid or
// expired session", 401) while the cookie is still present and in date.
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_EXPIRES_IN = "7d";

// Secure cookies are dropped over plain http, and local dev is http on
// localhost. Derive this from the client's own scheme rather than NODE_ENV,
// which neither `npm run start` nor the Dockerfile sets.
const secure = (process.env.FRONTEND_BASE_URL ?? "").startsWith("https://");

/**
 * The browser reaches this server through the client's own origin (the
 * /backend/:path* rewrite in client/next.config.ts), so the session cookie is
 * first-party and SameSite=Lax is enough — it was only ever "none" to survive
 * being third-party. Lax still rides the Twitch -> /callback hop, which is a
 * top-level GET navigation.
 */
export const sessionCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_MS,
};

// clearCookie has to match every attribute except maxAge, or the browser keeps
// the cookie it was told to drop.
export const clearSessionCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: "lax",
  path: "/",
};

// Short-lived CSRF state for the two OAuth start/callback pairs.
export const oauthStateCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure,
  maxAge: 10 * 60 * 1000,
};

export function signSession(payload) {
  return jwt.sign(payload, JWT, { expiresIn: SESSION_EXPIRES_IN });
}

export function verifySession(token) {
  return jwt.verify(token, JWT);
}
