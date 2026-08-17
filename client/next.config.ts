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
};

export default nextConfig;
