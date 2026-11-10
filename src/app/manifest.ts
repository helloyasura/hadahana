import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/lib/base-path";

const base = BASE_PATH || "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hadahana",
    short_name: "Hadahana",
    description:
      "Sri Lankan Kendraya & Handahana workspace — Sinhala + English jyotishiya toolkit",
    start_url: base ? `${base}/` : "/",
    scope: base ? `${base}/` : "/",
    display: "standalone",
    background_color: "#090c19",
    theme_color: "#0b0e1d",
    icons: [
      {
        src: `${base}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${base}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
