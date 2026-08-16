import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [" http://172.25.167.163:3000"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.hashnode.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
