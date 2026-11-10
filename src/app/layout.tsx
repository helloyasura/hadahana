import AnalyticsConsent from "@/components/AnalyticsConsent";
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Noto_Sans_Sinhala } from "next/font/google";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";
import "./cosmic.scss";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Noto_Sans_Sinhala({
  variable: "--font-body",
  subsets: ["sinhala", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0b0e1d",
};

export const metadata: Metadata = {
  title: "හඳහන ස්ටූඩියෝ · Handahana Studio",
  description:
    "Sri Lankan Kendraya & Handahana workspace — Sinhala + English jyotishiya toolkit",
  applicationName: "Hadahana",
  // Explicit icons keep hrefs prefixed under basePath (/hadahana). Next's
  // file-convention favicon.ico detector only matches "/favicon.ico".
  icons: {
    icon: [
      {
        url: withBasePath("/favicon.ico"),
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
      {
        url: withBasePath("/icon.svg"),
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: withBasePath("/apple-icon.png"),
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="si">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        {children}
        <AnalyticsConsent />
      </body>
    </html>
  );
}
