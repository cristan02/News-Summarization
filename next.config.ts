import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsdom"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile images
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // GitHub profile images
      },
    ],
  },
  turbopack: {
    // ...
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only packages on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        jsdom: false,
      };
    }
    return config;
  },
};

export default nextConfig;
