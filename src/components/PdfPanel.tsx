"use client";
import { useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/base-path";
import { track } from "@/lib/analytics";
import type { Lang } from "@/lib/i18n";
import { PDF_SIZES, type PdfSize, type PdfOrientation } from "@/lib/pdf/options";
import type { PanchangaInput } from "@/lib/astrology/panchanga-schema";
export function PdfPanel({ lang, horoscopeId, panchanga }: { lang: Lang; horoscopeId?: string; panchanga?: PanchangaInput }) {
  const si = lang === "si";
  const target = panchanga ? JSON.stringify(panchanga) : "";
  const requestAbort = useRef<AbortController | null>(null);
  const [size, setSize] = useState<PdfSize>("A4");
  const [orientation, setOrientation] = useState<PdfOrientation>("portrait");
  const [pdf, setPdf] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { const controller = new AbortController(); requestAbort.current = controller; setPdf(null); setError(""); setBusy(false); return () => controller.abort(); }, [size, orientation, horoscopeId, target]);
  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf); }, [pdf]);
  async function preview() {
    if (!horoscopeId && !target) return;
    const signal = requestAbort.current?.signal;
    track("tool_used", { tool: "export" });
    setBusy(true); setError(""); setPdf(null);
    try {
      const endpoint = target ? "/api/panchanga/pdf" : `/api/horoscopes/${encodeURIComponent(horoscopeId!)}/pdf`;
      const response = await fetch(apiUrl(`${endpoint}?size=${size}&orientation=${orientation}`), { cache: "no-store", signal, ...(target ? { method: "POST", headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" }, body: target } : {}) });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error || "PDF unavailable"); }
      const blob = await response.blob();
      if (!signal?.aborted) setPdf(URL.createObjectURL(blob));
    } catch (err) { if (!signal?.aborted) setError(err instanceof Error ? err.message : "PDF unavailable"); }
    finally { if (!signal?.aborted) setBusy(false); }
  }
  return <section className="pdf-panel no-print" aria-label={si ? "PDF බලන්න / බාගන්න" : "View / Download PDF"}>
    <span className="section-index">CELESTIAL ARCHIVE / PDF</span><h2>{si ? "PDF බලන්න / බාගන්න" : "View / Download PDF"}</h2>
    <p className="muted">{target ? (si ? "තෝරාගත් දිනය සහ ස්ථානය සඳහා පංචාංගය සේවාදායකයේ සකසයි." : "Panchanga is calculated and typeset on the server for the displayed date and location.") : (si ? "ඔබේ හඳහන තෝරාගත් කඩදාසි ප්‍රමාණයට සේවාදායකයේ සකසයි." : "Your saved horoscope, precisely typeset on the server for your selected paper size.")}</p>
    <div className="pdf-actions"><label>{si ? "කඩදාසි ප්‍රමාණය" : "Paper size"}<select aria-label={si ? "කඩදාසි ප්‍රමාණය" : "Paper size"} value={size} disabled={busy} onChange={event => setSize(event.target.value as PdfSize)}>{PDF_SIZES.map(s => <option key={s}>{s}</option>)}</select></label>
    <label>{si ? "දිශානතිය" : "Orientation"}<select aria-label={si ? "දිශානතිය" : "Orientation"} value={orientation} disabled={busy} onChange={event => setOrientation(event.target.value as PdfOrientation)}><option value="portrait">{si ? "සිරස්" : "Portrait"}</option><option value="landscape">{si ? "තිරස්" : "Landscape"}</option></select></label>
    <button type="button" className="primary" disabled={(!horoscopeId && !target) || busy} onClick={preview}>{busy ? (si ? "සකසමින්…" : "Rendering…") : (si ? "PDF පෙරදසුන" : "View PDF")}</button>
    {pdf && <><a className="pdf-download" href={pdf} download={`${target ? "panchanga" : "hadahana"}-${size}.pdf`} onClick={() => track("chart_exported", { mode: "pdf", paper: size })}>{si ? "PDF බාගන්න" : "Download PDF"} ↓</a><a href={pdf} target="_blank" rel="noopener noreferrer">{si ? "නව කවුළුවක බලන්න" : "Open full preview"} ↗</a></>}</div>
    <p role="status" aria-live="polite">{error || (busy ? (si ? "කරුණාකර රැඳී සිටින්න." : "Please wait. This can take a few seconds.") : "")}</p>
    {pdf && <iframe className="pdf-preview" title={target ? (si ? "පංචාංග PDF පෙරදසුන" : "Panchanga PDF preview") : (si ? "හඳහන PDF පෙරදසුන" : "Horoscope PDF preview")} src={pdf} />}
    {pdf && <p className="muted">{si ? "පෙරදසුන නොපෙනේ නම් PDF බාගන්න හෝ නව කවුළුවක බලන්න." : "If your mobile browser cannot show the embedded PDF, download it or open the full preview."}</p>}
  </section>;
}
