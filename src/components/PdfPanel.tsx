"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/base-path";
import { track } from "@/lib/analytics";
import type { Lang } from "@/lib/i18n";
import { PDF_SIZES, type PdfSize, type PdfOrientation } from "@/lib/pdf/options";
export function PdfPanel({ lang, horoscopeId }: { lang: Lang; horoscopeId?: string }) {
  const si = lang === "si";
  const [size, setSize] = useState<PdfSize>("A4");
  const [orientation, setOrientation] = useState<PdfOrientation>("portrait");
  const [pdf, setPdf] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setPdf(null); setError(""); }, [size, orientation, horoscopeId]);
  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf); }, [pdf]);
  async function preview() {
    if (!horoscopeId) return;
    track("tool_used", { tool: "export" });
    setBusy(true); setError(""); setPdf(null);
    try {
      const response = await fetch(apiUrl(`/api/horoscopes/${encodeURIComponent(horoscopeId)}/pdf?size=${size}&orientation=${orientation}`), { cache: "no-store" });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error || "PDF unavailable"); }
      setPdf(URL.createObjectURL(await response.blob()));
    } catch (err) { setError(err instanceof Error ? err.message : "PDF unavailable"); }
    finally { setBusy(false); }
  }
  return <section className="pdf-panel no-print" aria-label={si ? "PDF බලන්න / බාගන්න" : "View / Download PDF"}>
    <span className="section-index">CELESTIAL ARCHIVE / PDF</span><h2>{si ? "PDF බලන්න / බාගන්න" : "View / Download PDF"}</h2>
    <p className="muted">{si ? "ඔබේ හඳහන තෝරාගත් කඩදාසි ප්‍රමාණයට සේවාදායකයේ සකසයි." : "Your saved horoscope, precisely typeset on the server for your selected paper size."}</p>
    <div className="pdf-actions"><label>{si ? "කඩදාසි ප්‍රමාණය" : "Paper size"}<select value={size} disabled={busy} onChange={event => setSize(event.target.value as PdfSize)}>{PDF_SIZES.map(s => <option key={s}>{s}</option>)}</select></label>
    <label>{si ? "දිශානතිය" : "Orientation"}<select value={orientation} disabled={busy} onChange={event => setOrientation(event.target.value as PdfOrientation)}><option value="portrait">{si ? "සිරස්" : "Portrait"}</option><option value="landscape">{si ? "තිරස්" : "Landscape"}</option></select></label>
    <button type="button" className="primary" disabled={!horoscopeId || busy} onClick={preview}>{busy ? (si ? "සකසමින්…" : "Rendering…") : (si ? "PDF පෙරදසුන" : "View PDF")}</button>
    {pdf && <><a className="pdf-download" href={pdf} download={`hadahana-${size}.pdf`} onClick={() => track("chart_exported", { mode: "pdf", paper: size })}>{si ? "PDF බාගන්න" : "Download PDF"} ↓</a><a href={pdf} target="_blank" rel="noopener noreferrer">{si ? "නව කවුළුවක බලන්න" : "Open full preview"} ↗</a></>}</div>
    <p role="status" aria-live="polite">{error || (busy ? (si ? "කරුණාකර රැඳී සිටින්න." : "Please wait. This can take a few seconds.") : "")}</p>
    {pdf && <iframe className="pdf-preview" title={si ? "හඳහන PDF පෙරදසුන" : "Horoscope PDF preview"} src={pdf} />}
    {pdf && <p className="muted">{si ? "පෙරදසුන නොපෙනේ නම් PDF බාගන්න හෝ නව කවුළුවක බලන්න." : "If your mobile browser cannot show the embedded PDF, download it or open the full preview."}</p>}
  </section>;
}
