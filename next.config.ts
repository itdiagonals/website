import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    const internalApiUrl = process.env.INTERNAL_API_URL || 'http://backend:8080/api/v1'

    return [
      {
        source: '/api/v1/:path*',
        destination: `${internalApiUrl}/:path*`,
      },
    ]
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
