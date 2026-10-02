import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'self'",
  `script-src 'self' 'unsafe-inline' https://api.longdo.com${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://longdo.com https://*.longdo.com",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://server.arcgisonline.com https://services.arcgisonline.com https://longdo.com https://*.longdo.com",
  "connect-src 'self' https://longdo.com https://*.longdo.com wss://*.longdo.com",
  "font-src 'self' data: https://longdo.com https://*.longdo.com", "worker-src 'self' blob:", "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
      ],
    }];
  },
};

export default nextConfig;
