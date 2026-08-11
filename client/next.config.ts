import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_SHA: process.env.GIT_SHA ?? "dev",
  },
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
