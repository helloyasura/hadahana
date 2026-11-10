"use client";
import { useState } from "react";
import type { PeriodReport } from "@/lib/astrology/dosha-periods";
import { apiUrl } from "@/lib/base-path";
const date = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
export function DoshaPeriods({ horoscopeId }: { horoscopeId: string }) {
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  async function load() {
    setPending(true); setError("");
    try {
      const res = await fetch(apiUrl(`/api/horoscopes/${encodeURIComponent(horoscopeId)}/periods`), { cache: "no-store" });
      const j = await res.json(); if (!j.ok) throw new Error(j.error || "Unable to load periods"); setReport(j.report);
    } catch(e) { setError(e instanceof Error ? e.message : "Unable to load periods"); } finally { setPending(false); }
  }
  return <section className="period-report stack" aria-busy={pending}>
    <h3>අරිෂ්ට / දෝෂ කාල <small>Challenging periods</small></h3>
    <p>සාම්ප්‍රදායික කාල සලකුණු සන්සුන්ව සලකා බලමු. / Reflect calmly on traditional timing indicators.</p>
    <p className="muted">මෙය හඳහන පත්‍රයට හෝ එහි PDF එකට එක් නොවේ. / Separate from your horoscope paper and PDF.</p>
    <button type="button" className="primary" disabled={pending} onClick={load}>{pending ? "ගණනය කරමින් / Calculating…" : "කාල සටහන බලන්න / View periods"}</button>
    {error && <p className="error" role="alert">{error}</p>}
    {report && <>
      <p role="note">{report.disclaimer}</p>
      <p>{date(report.windowStartUtc)} – {date(report.windowEndUtc)} · Asia/Colombo (ශ්‍රී ලංකා වේලාව)</p>
      {report.childNote && <aside className="period-note">{report.childNote}</aside>}
      <label>කාලය / Show <select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">සියල්ල / All</option><option value="current">දැනට / Current</option><option value="future">ඉදිරි / Upcoming</option><option value="past">පසුගිය / Recent past</option></select></label>
      <p className="muted">තීව්‍රතාව යනු නීති-පදනම් සලකුණකි; සිදුවීමක සම්භාවිතාව හෝ බරපතළකම නොවේ. Intensity is a rule-based label, not a risk score. Dates at the report edge are clipped; durations then describe only the visible window.</p>
      <div className="period-list">{report.periods.filter(p => filter === "all" || (filter === "current" ? p.current : filter === "past" ? p.endUtc <= report.asOfUtc : p.startUtc > report.asOfUtc)).map(p => <article key={p.id} className="period-card" data-current={p.current}>
        <header><h4>{p.titleSi}<small>{p.titleEn}</small></h4><strong>{p.current ? "දැනට / Current · " : ""}{{ low: "අඩු / Low", medium: "මධ්‍යම / Medium", high: "වැඩි / High" }[p.intensity]}</strong></header>
        <p>{p.clippedStart ? "≤ " : ""}{date(p.startUtc)} – {p.clippedEnd ? "≥ " : ""}{date(p.endUtc)} · {p.durationDays} දින / days{(p.clippedStart || p.clippedEnd) && " (සීමා කළ කවුළුව / clipped window)"}</p>
        <p>{p.planets.join(" / ")} · {p.houses.join(", ")}</p>
        <ul>{p.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
        <details><summary>ශාන්ති කර්ම / Optional traditional practices</summary><ul>{p.remedies.map(r => <li key={r}>{r}</li>)}</ul></details>
      </article>)}</div>
      {!report.periods.some(p => p.current) && <p>මෙම නීති අනුව දැනට සලකුණු කළ කාලයක් නැත. / No current period flagged by these rules.</p>}
      <p className="muted">{report.convention}</p>
    </>}
  </section>;
}
