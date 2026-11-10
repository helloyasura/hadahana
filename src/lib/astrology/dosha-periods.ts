import { EphemerisService, SE } from "vpv-panchangam/dist/ephemeris";
import type { castKendraya } from "./kendraya";
import { DASHA_YEAR_DAYS, vimshottari } from "./vimshottari";
import { grahaLabel } from "./sinhala-names";

type Chart = Awaited<ReturnType<typeof castKendraya>>;
const DAY = 86400000;
const LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];
const OWNERS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
export const PERIOD_DISCLAIMER = "මෙය සාම්ප්‍රදායික ජ්‍යොතිෂ මඟපෙන්වීමක් පමණි; නියත සිදුවීම් හෝ අනතුරු පිළිබඳ අනාවැකියක් නොවේ. සුදුසුකම් ලත් ජ්‍යොතිෂවේදියෙකුගෙන් උපදෙස් ගන්න. Traditional astrology, not certainty or medical advice.";
export const CHILD_NOTE = "බාලාරිෂ්ට: වයස 12ට අඩු දරුවන් සඳහා පැරණි සම්ප්‍රදායේ වෙනම සලකා බැලීම් ඇත. මෙහි බාලාරිෂ්ට දෝෂයක් හෝ ආයුෂ නිගමනයක් ගණනය නොකරයි. ආදරණීය රැකවරණය හා සාමාන්‍ය වෛද්‍ය උපදෙස් ප්‍රමුඛයි. Under 12: no longevity or health prediction is made.";
export const REMEDIES = [
  "කැමැත්ත අනුව බෝධි පූජා, පිරිත් ශ්‍රවණය හා දානය / Optional Bodhi puja, pirith and dana.",
  "තම ආගමට ගැළපේ නම් දැනුමැති උපදේශකයෙකු සමඟ ග්‍රහ ශාන්ති පූජාවක් හෝ මන්ත්‍ර සජ්ඣායනය / Optional graha shanti or mantra with a trusted guide.",
  "මැණික්, වර්ණ හා දින පිළිවෙත් සියලු දෙනාට එකසේ නොගැළපේ; පුද්ගලික උපදෙස් නැතිව මැණික් මිලදී නොගන්න. Gem, colour and day prescriptions need individual review; no purchase is necessary.",
  "මේවා මනස සන්සුන් කිරීමට කැමැත්තෙන් කරන සිරිත් පමණි; ගැටලු විසඳීමේ සහතිකයක් හෝ වෛද්‍ය/මූල්‍ය උපදෙස් වෙනුවට ආදේශයක් නොවේ. No guaranteed cure; ordinary practical care comes first.",
];
const PLANET_DAYS: Record<string, string> = {
  Sun: "ඉරිදා / Sunday", Moon: "සඳුදා / Monday", Mars: "අඟහරුවාදා / Tuesday",
  Mercury: "බදාදා / Wednesday", Jupiter: "බ්‍රහස්පතින්දා / Thursday", Venus: "සිකුරාදා / Friday", Saturn: "සෙනසුරාදා / Saturday",
};
function practices(planets: string[]) {
  return [...planets.filter(p => PLANET_DAYS[p]).map(p => `${grahaLabel(p).sinhala} (${p}): ${PLANET_DAYS[p]} යනු සාම්ප්‍රදායික ග්‍රහ දිනයයි. කැමති නම් දානය හෝ යහපත් සේවයක් සඳහා තෝරාගත හැක; අනිවාර්ය නැත. Symbolic day for optional dana or service, not a required remedy.`), ...REMEDIES];
}
export type Period = {
  id: string; kind: "dasha" | "transit"; titleSi: string; titleEn: string;
  startUtc: string; endUtc: string; durationDays: number; current: boolean;
  intensity: "low" | "medium" | "high"; planets: string[]; houses: string[];
  reasons: string[]; remedies: string[]; clippedStart: boolean; clippedEnd: boolean;
};
export type PeriodReport = { asOfUtc: string; windowStartUtc: string; windowEndUtc: string; timezone: string; periods: Period[]; childNote: string | null; disclaimer: string; convention: string };
export const signOf = (longitude: number) => Math.floor(((longitude % 360) + 360) % 360 / 30);
export const houseFrom = (sign: number, origin: number) => (sign - origin + 12) % 12 + 1;
export function lordIssues(chart: Chart, lord: string) {
  const p = chart.navagraha.find(p => p.graha === lord);
  const owned = OWNERS.flatMap((o, s) => o === lord ? [houseFrom(s, signOf(chart.lagna.longitude))] : []);
  // A mixed lord is not automatically labelled malefic when it owns a trine.
  const functional = owned.some(h => [3, 6, 11].includes(h)) && !owned.some(h => [1, 5, 9].includes(h));
  const reasons = [
    ...(functional ? ["ලග්නයෙන් 3/6/11 අධිපති (ත්‍රිකෝණ අධිපති නොවේ) / functional malefic"] : []),
    ...owned.filter(h => [6, 8, 12].includes(h)).map(h => `${h} භාව අධිපති / house lord`),
    ...(p && [6, 8, 12].includes(p.bhava) ? [`${p.bhava} භාවයේ පිහිටීම / natal occupancy`] : []),
    ...(p?.debilitated ? ["නීච / debilitated"] : []), ...(p?.combust ? ["අස්ත / combust"] : []),
  ];
  return { reasons, houses: [...new Set([...owned, ...(p ? [p.bhava] : [])])].map(h => `${h} (ලග්නයෙන් / from Lagna)`) };
}
/** Locate every sign change, including retrograde re-entry; half-open intervals. */
export function signIntervals(start: number, end: number, longitude: (ms: number) => number) {
  const rows: { start: number; end: number; sign: number }[] = [];
  let cursor = start, sign = signOf(longitude(start));
  for (let t = start; t < end;) {
    const next = Math.min(t + DAY / 4, end), nextSign = signOf(longitude(next));
    if (nextSign !== sign) {
      let lo = t, hi = next;
      while (hi - lo > 1000) { const mid = (lo + hi) / 2; if (signOf(longitude(mid)) === sign) lo = mid; else hi = mid; }
      rows.push({ start: cursor, end: hi, sign }); cursor = hi; sign = nextSign;
    }
    t = next;
  }
  rows.push({ start: cursor, end, sign }); return rows;
}
// Only anonymous, geocentric transits cached. Bounded to one rolling window.
let transitCache: { key: string; rows: { planet: string; start: number; end: number; sign: number }[] } | undefined;
export async function difficultPeriods(chart: Chart, asOf = new Date()): Promise<PeriodReport> {
  const now = asOf.getTime(); if (!Number.isFinite(now)) throw new Error("Invalid report date");
  const birth = Date.parse(chart.native.utcTime);
  const left = new Date(now); left.setUTCFullYear(left.getUTCFullYear() - 2); left.setUTCHours(0, 0, 0, 0);
  const right = new Date(now); right.setUTCFullYear(right.getUTCFullYear() + 10); right.setUTCHours(0, 0, 0, 0);
  const end = right.getTime(), start = Math.min(end, Math.max(left.getTime(), birth));
  const periods: Period[] = [];
  function add(kind: Period["kind"], titleSi: string, titleEn: string, a: number, b: number, planets: string[], houses: string[], reasons: string[], intensity: Period["intensity"]) {
    if (b <= start || a >= end) return;
    const s = Math.max(a, start), e = Math.min(b, end);
    periods.push({ id: `${kind}-${titleEn}-${a}`, kind, titleSi, titleEn, startUtc: new Date(s).toISOString(), endUtc: new Date(e).toISOString(), durationDays: Math.round((e - s) / DAY * 10) / 10, current: s <= now && now < e, intensity, planets, houses, reasons, remedies: practices(planets), clippedStart: a < start, clippedEnd: b > end });
  }
  const v = vimshottari(chart.chandra.longitude, chart.native.utcTime);
  let cursor = birth - v.elapsedFraction * YEARS[LORDS.indexOf(v.maha[0].lord)] * DASHA_YEAR_DAYS * DAY;
  const first = LORDS.indexOf(v.maha[0].lord);
  for (let n = 0; cursor < end && n < 36; n++) {
    const idx = (first + n) % 9, lord = LORDS[idx], duration = YEARS[idx] * DASHA_YEAR_DAYS * DAY;
    let sub = cursor;
    const major = lordIssues(chart, lord);
    for (let i = 0; i < 9; i++) {
      const subIdx = (idx + i) % 9, subLord = LORDS[subIdx];
      const subEnd = i === 8 ? cursor + duration : sub + duration * YEARS[subIdx] / 120;
      const minor = lordIssues(chart, subLord);
      const reasons = [...major.reasons.map(r => `${grahaLabel(lord).sinhala} (${lord}) මහ දසා: ${r}`), ...minor.reasons.map(r => `${grahaLabel(subLord).sinhala} (${subLord}) අන්තර් දසා: ${r}`)];
      if (reasons.length) add("dasha", `${grahaLabel(lord).sinhala} / ${grahaLabel(subLord).sinhala} දසා`, `${lord} / ${subLord} dasha`, Math.max(sub, birth), subEnd, [...new Set([lord, subLord])], [...new Set([...major.houses, ...minor.houses])], reasons, reasons.length >= 4 ? "high" : reasons.length >= 2 ? "medium" : "low");
      sub = subEnd;
    }
    cursor += duration;
  }
  const key = `${left.toISOString()}-${right.toISOString()}`;
  if (transitCache?.key !== key) {
    const ephe = EphemerisService.getInstance(); await ephe.init(); ephe.setAyanamsa("lahiri");
    // Synchronous after setAyanamsa: another request cannot change shared mode mid-scan.
    const rows = [["Saturn", SE.SATURN], ["Jupiter", SE.JUPITER], ["Rahu", SE.MEAN_NODE]].flatMap(([planet, id]) => signIntervals(left.getTime(), end, ms => ephe.calcUt(ms / DAY + 2440587.5, Number(id)).lon).map(r => ({ ...r, planet: String(planet) })));
    transitCache = { key, rows };
  }
  const moon = signOf(chart.chandra.longitude), lagna = signOf(chart.lagna.longitude);
  for (const r of transitCache.rows) {
    for (const planet of r.planet === "Rahu" ? ["Rahu", "Ketu"] : [r.planet]) {
      const sign = planet === "Ketu" ? (r.sign + 6) % 12 : r.sign, h = houseFrom(sign, moon);
      const a = r.start === left.getTime() ? -Infinity : r.start, b = r.end === end ? Infinity : r.end;
      if (planet === "Saturn") {
        const label = [12, 1, 2].includes(h) ? ["සෙනසුරු සාඩේ සාත් / ඒරාෂ්ටක", "Sade Sati"] : h === 8 ? ["අෂ්ටම සෙනසුරු", "Ashtama Shani"] : [4, 7, 10].includes(h) ? ["කණ්ටක සෙනසුරු", "Kantaka Shani"] : null;
        if (label) add("transit", label[0], label[1], a, b, [planet], [`${h} (චන්ද්‍රයාගෙන් / from Moon)`], ["නිරයන රාශි ගෝචරය / sidereal whole-sign transit"], [1, 8].includes(h) ? "high" : "medium");
      } else if (planet === "Jupiter" && h === 8) add("transit", "අෂ්ටම ගුරු", "Jupiter eighth from Moon", a, b, [planet], ["8 (චන්ද්‍රයාගෙන් / from Moon)"], ["ගුරු චන්ද්‍රයාගෙන් 8 වන රාශියේ / Jupiter in eighth sign from Moon"], "low");
      else if (["Rahu", "Ketu"].includes(planet) && (sign === moon || sign === lagna)) add("transit", `${grahaLabel(planet).sinhala} ගෝචරය`, `${planet} over Moon / Lagna`, a, b, [planet], [...(sign === moon ? ["1 (චන්ද්‍රයාගෙන් / from Moon)"] : []), ...(sign === lagna ? ["1 (ලග්නයෙන් / from Lagna)"] : [])], ["ජන්ම රාශිය සමඟ එකම රාශියේ; අංශක සංයෝගයක් නොවේ / sign-level contact, not exact conjunction"], "medium");
    }
  }
  periods.sort((a, b) => Number(b.current) - Number(a.current) || a.startUtc.localeCompare(b.startUtc));
  return { asOfUtc: asOf.toISOString(), windowStartUtc: new Date(start).toISOString(), windowEndUtc: new Date(end).toISOString(), timezone: "Asia/Colombo", periods, childNote: now >= birth && now - birth < 12 * DASHA_YEAR_DAYS * DAY ? CHILD_NOTE : null, disclaimer: PERIOD_DISCLAIMER, convention: "Lahiri · Swiss Ephemeris · mean Rahu / opposite Ketu · 365.25-day dasha years · Asia/Colombo. Window-limited dates are not full period boundaries." };
}
