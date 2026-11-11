import { withBasePath } from "@/lib/base-path";
export default function Shell({
  children,
  active,
  publicView = false,
}: {
  children: React.ReactNode;
  active?: string;
  publicView?: boolean;
}) {
  return (
    <div className="pro-shell">
      <header className="pro-header">
        <a className="pro-brand" href={withBasePath("/pro")}>
          <span className="pro-brand-mark">✧</span>
          <span>
            ජෝතිෂ <b>Pro</b>
            <small>ERVANTA · PROFESSIONAL WORKSPACE</small>
          </span>
        </a>
        <span className="pro-pill">
          {publicView ? "පෞද්ගලික සබැඳිය" : "PRIVATE PILOT"}
        </span>
      </header>
      {active && (
        <nav className="pro-nav" aria-label="Pro navigation">
          {[
            ["dashboard", "දළ විශ්ලේෂණය", "/pro"],
            ["studio", "දෘශ්‍ය වැඩබිම", "/pro/studio"],
            ["presets", "ගණනය කිරීමේ ක්‍රම", "/pro/presets"],
            ["links", "සබැඳි", "/pro/links"],
            ["tools", "යොමු මෙවලම්", "/pro/tools"],
          ].map(([key, label, url]) => (
            <a
              key={key}
              aria-current={active === key ? "page" : undefined}
              href={withBasePath(url)}
            >
              {label}
            </a>
          ))}
        </nav>
      )}
      <main>{children}</main>
      <footer className="pro-footer">
        වෘත්තීය ක්‍රමවල පැහැදිලි බව. ඔබගේ දැනුම, ඔබගේ වැඩබිම.
        <span>සම්ප්‍රදායික මඟපෙන්වීමක් පමණි — නිශ්චිත අනාවැකි නොවේ.</span>
      </footer>
    </div>
  );
}
