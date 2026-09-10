import type { NextConfig } from "next";
import pkg from "./package.json";

// Origin of the Express server. Only ever used as the *destination* of the
// rewrite below and by the two consumers that can't go through it (Server
// Components and Socket.IO) — see src/lib/config.ts.
const SERVER_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_SHA: process.env.GIT_SHA ?? "dev",
  },
  // Proxy the API under this app's own origin. The server sets the `sid`
  // session cookie with no Domain attribute, so it is host-only: set directly
  // by the server it would belong to the server's host (onrender.com) and be
  // invisible to middleware.ts and to cookies() here (vercel.app). Neither host
  // can bridge the gap — vercel.app and onrender.com are both on the Public
  // Suffix List, so no Domain attribute may span them. Routing the browser
  // through this rewrite makes the cookie first-party instead.
  //
  // This only ever worked locally because cookies ignore port numbers, so
  // localhost:3000 and localhost:5173 share one cookie jar. Dev goes through the
  // proxy too, so that accident stops hiding this class of bug.
  //
  // Note: WebSocket upgrades are NOT proxied by rewrites — Socket.IO still
  // connects straight to SERVER_ORIGIN.
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${SERVER_ORIGIN}/:path*` }];
  },
  // Vercel caches upstream responses on external rewrites by default. These are
  // per-session authenticated API responses; a shared cache entry would serve
  // one streamer's data to another.
  async headers() {
    return [
      {
        source: "/backend/:path*",
        headers: [{ key: "x-vercel-enable-rewrite-caching", value: "0" }],
      },
    ];
  },
  // yt-search (used by /api/search) pulls in cheerio, which the webpack
  // build (required for Chakra/Emotion — Turbopack breaks its SSR output)
  // fails to bundle correctly. Leaving it external makes it a plain
  // runtime require() instead.
  serverExternalPackages: ["yt-search", "cheerio"],
  images: {
    remotePatterns: [
      {
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/vi/**",
      },
      { hostname: "static-cdn.jtvnw.net" },
    ],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Rewrite barrel imports (`import { Box } from "@chakra-ui/react"`) to
    // direct submodule paths at compile time. Without this, every page pulls
    // the whole Chakra + @ark-ui/react surface into its client-component
    // graph: First Load JS balloons past 480 kB and Next's flight-entry
    // loader emits a ~215 kB request string per entry that webpack's
    // filesystem cache then warns about serializing ("Serializing big
    // strings impacts deserialization performance"). lucide-react is listed
    // for the same reason, though its icons are also deep-imported directly.
    optimizePackageImports: ["@chakra-ui/react", "lucide-react"],
  },
};

export default nextConfig;
