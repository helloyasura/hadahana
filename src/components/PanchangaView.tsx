import type { Lang } from "@/lib/i18n";
import { panchangaRows, type PanchangaData } from "@/lib/astrology/panchanga-view";
export function PanchangaView({ data, lang }: { data: PanchangaData; lang: Lang }) {
  const si = lang === "si";
  const { limbs, sun, periods } = panchangaRows(data, lang);
  return <section className="panchanga-view" aria-label={si ? "පංචාංග විස්තර" : "Panchanga details"}>
    <header><span className="section-index">DAILY CELESTIAL ALMANAC</span><h2>{si ? "පංචාංග" : "Panchanga"}</h2><p>{data.date} · {data.place}</p><p className="muted">{si ? "සියලු වේලාවන් දේශීය වේලාවෙන්" : "All times in local time"} · {data.timezone}</p></header>
    <dl className="panchanga-grid">{limbs.map(row => <div className="panchanga-card" key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd>{row.detail && <dd className="panchanga-detail">{row.detail}</dd>}</div>)}</dl>
    <dl className="panchanga-sun">{sun.map(row => <div className="panchanga-card" key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
    <h3>{si ? "අසුබ කාල සීමා" : "Inauspicious periods"}</h3>
    <dl className="panchanga-periods">{periods.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
    <p className="muted">{si ? data.noteSi : data.noteEn}</p><p className="muted">{si ? "— යනු මෙම දිනයට හෝ ස්ථානයට දත්ත නොමැති බවයි." : "— means unavailable for this date or location."}</p>
  </section>;
}
