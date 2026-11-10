import type { Metadata } from "next";
import { Space_Grotesk, Noto_Sans_Sinhala } from "next/font/google";
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

export const metadata: Metadata = {
  title: "හඳහන ස්ටූඩියෝ · Handahana Studio",
  description:
    "Sri Lankan Kendraya & Handahana workspace — Sinhala + English jyotishiya toolkit",
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
      </body>
    </html>
  );
}
