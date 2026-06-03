import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const midtransHost = "https://app.midtrans.com";
const midtransSandboxHost = "https://app.sandbox.midtrans.com";
const midtransApiHost = "https://api.midtrans.com";

const devImageOrigins = isProd ? "" : "http://localhost:9000 http://127.0.0.1:9000";
const devConnectOrigins = isProd ? "" : "http://localhost:9000 http://localhost:8080 http://localhost:3000 ws://localhost:3000";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  `frame-src 'self' ${midtransHost} ${midtransSandboxHost} https://*.midtrans.com`,
  `frame-ancestors 'none'`,
  `img-src 'self' data: blob: https://cdn.diagonals.id https://s3.diagonals.id ${midtransHost} ${midtransSandboxHost} https://*.midtrans.com ${devImageOrigins}`.trim(),
  `font-src 'self' data: https://fonts.gstatic.com`,
  `connect-src 'self' https://api.diagonals.id ${midtransApiHost} ${midtransHost} ${midtransSandboxHost} https://*.midtrans.com https://static.cloudflareinsights.com ${devConnectOrigins}`.trim(),
  `script-src 'self' 'unsafe-inline' ${isProd ? "" : "'unsafe-eval' "}${midtransHost} ${midtransSandboxHost} https://*.midtrans.com https://static.cloudflareinsights.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  `media-src 'self' blob:`,
  isProd ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=(self)",
      "camera=()",
      "cross-origin-isolated=()",
      "display-capture=(self)",
      "encrypted-media=(self)",
      "fullscreen=(self)",
      "geolocation=(self)",
      "gyroscope=()",
      "keyboard-map=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=(self)",
      "picture-in-picture=(self)",
      "publickey-credentials-get=(self)",
      "screen-wake-lock=()",
      "sync-xhr=()",
      "usb=()",
      "web-share=(self)",
      "xr-spatial-tracking=()",
    ].join(", "),
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  {
    key: "Origin-Agent-Cluster",
    value: "?1",
  },
];

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
