import type { NextConfig } from "next";

/**
 * Live droplet mounts the app at https://ervanta.com/hadahana
 * (NEXT_PUBLIC_BASE_PATH=/hadahana). Local `npm run dev` leaves it empty.
 */
const rawBase = (process.env.NEXT_PUBLIC_BASE_PATH || "").trim();
const basePath =
  rawBase && rawBase !== "/"
    ? rawBase.startsWith("/")
      ? rawBase.replace(/\/$/, "")
      : `/${rawBase.replace(/\/$/, "")}`
    : "";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "playwright-core",
    "vpv-panchangam",
    "@swisseph/browser",
  ],
  outputFileTracingIncludes: {
    "/api/horoscopes/*/pdf": ["./node_modules/playwright-core/**/*"],
    "/**": [
      "./node_modules/vpv-panchangam/dist/**/*",
      "./node_modules/@swisseph/browser/dist/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/pro/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, private" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'none'; form-action 'self'; img-src 'self' data:;",
          },
        ],
      },
    ];
  },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "ervanta.com",
    "www.ervanta.com",
  ],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
