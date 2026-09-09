import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_SHA: process.env.GIT_SHA ?? "dev",
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
