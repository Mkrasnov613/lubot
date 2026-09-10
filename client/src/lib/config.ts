/**
 * Browser-side API base. Relative on purpose: requests stay on this app's own
 * origin and are proxied to the Express server by the `/backend/:path*` rewrite
 * in next.config.ts. That is what makes the server's `sid` cookie first-party,
 * so middleware.ts and cookies() can actually see it.
 *
 * Never replace this with an absolute server URL in browser code — that
 * reintroduces the cross-site cookie the proxy exists to avoid, which Safari
 * and Firefox block outright.
 */
export const API_BASE_URL = "/backend";

/**
 * Absolute origin of the Express server, for the two consumers that cannot use
 * the proxy: Node-side fetches (Server Components — Node's fetch rejects a
 * relative URL) and Socket.IO (rewrites don't proxy WebSocket upgrades).
 */
export const SERVER_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
