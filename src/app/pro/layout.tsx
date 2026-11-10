import type { Metadata } from "next";
import "./pro.css";
export const metadata: Metadata = {
  title: "ජෝතිෂ Pro · Ervanta",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";
export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pro-app" data-ph-no-capture>
      {children}
    </div>
  );
}
