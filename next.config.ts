import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
      protocol: "http",
      hostname: "localhost",
      port: "9000",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "cdn.diagonals.id",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "s3.diagonals.id",
      pathname: "/**",
    },
    ],
  },
};

export default nextConfig;
