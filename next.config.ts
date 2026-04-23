import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  "default-src 'self'",
  // Next.js App Router injects inline hydration scripts — unsafe-inline is required.
  // unsafe-eval is only needed in development for webpack HMR.
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  // Tailwind and Next.js inject inline styles.
  "style-src 'self' 'unsafe-inline'",
  // Fonts are self-hosted via next/font (downloaded at build time).
  "font-src 'self'",
  // data: covers any base64 images; https: covers external avatar URLs.
  "img-src 'self' data: https:",
  // Fetch/XHR stays same-origin. In dev also allow HMR websocket.
  isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
  // Supersedes X-Frame-Options for modern browsers.
  "frame-ancestors 'none'",
  // Prevent base-tag and form hijacking.
  "base-uri 'self'",
  "form-action 'self'",
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // X-Frame-Options kept for legacy browsers; frame-ancestors in CSP covers modern ones.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  // HSTS only in production — setting it on HTTP breaks local dev permanently.
  ...(!isDev
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
