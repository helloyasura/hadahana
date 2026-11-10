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
  serverExternalPackages: ["playwright-core"],
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  allowedDevOrigins: ["127.0.0.1", "localhost", "ervanta.com", "www.ervanta.com"],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
