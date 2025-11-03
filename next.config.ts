import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
