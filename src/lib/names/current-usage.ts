/**
 * Verify suggested names against current-generation usage in the
 * living country + chosen language (public web sources + curated fallback).
 */

import type { LivingCountry } from "@/lib/names/personalities";

export type NameLanguage = "si" | "en" | "bilingual";

export type CurrentUsagePack = {
  country: LivingCountry;
  language: NameLanguage;
  sourceLabels: string[];
  /** lowercased roman / latin forms seen in current usage */
  roman: Set<string>;
  /** sinhala forms when available */
  sinhala: Set<string>;
  fetchedAt: number;
  live: boolean;
};

type CacheEntry = { pack: CurrentUsagePack; expires: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 6 * 60 * 60 * 1000;

/** Curated modern Sri Lankan / diaspora first names (roman). */
const MODERN_LK_ROMAN = [
  "amal", "amaya", "anuki", "anuki", "oshadi", "nethmi", "nethuli", "senuri",
  "sithmi", "savi", "savidu", "sahan", "sasindu", "dineth", "dinithi", "thevindi",
  "yevindi", "mineth", "minuri", "kesev", "keshan", "kavindu", "kavindi", "thisara",
  "thisuri", "chamath", "chamodi", "ruwan", "ruwani", "nuwan", "nuwani", "kasun",
  "kasuni", "gayan", "gayani", "janith", "janithi", "lahiru", "lahiri", "isuru",
  "isuruni", "dilshan", "dilshani", "thilina", "thilini", "sandun", "sanduni",
  "ashan", "ashani", "vinura", "vinuri", "hesara", "hesara", "yenuli", "yenuka",
  "rineth", "rinuki", "senuka", "senuli", "oshada", "oshadi", "binura", "binudi",
  "lihini", "lihin", "nirmani", "nirman", "praveen", "praveena", "sanjaya", "sanjana",
  "anushka", "anoushka", "amila", "aruna", "dinesh", "indika", "janaka", "kapila",
  "mangala", "ranjan", "sagara", "suresh", "thilak", "upul", "wasana", "nirasha",
  "nashalia", "emily", "oliver", "sophia", "liam", "noah", "aria", "maya", "leo",
];

const MODERN_LK_SI = [
  "අමල්", "අමායා", "අනුකි", "ඔෂදි", "නෙත්මි", "නෙතුලි", "සෙනුරි", "සිත්මි",
  "සවි", "සවිදු", "සහන්", "සසිඳු", "දිනෙත්", "දිනිති", "තෙවිඳි", "යෙවිඳි",
  "මිනෙත්", "මිනුරි", "කේශාන්", "කවිඳු", "කවිඳි", "තිසර", "තිසුරි", "චමත්",
  "චමෝදි", "රුවන්", "රුවනි", "නුවන්", "කසුන්", "ගයාන්", "ජනිත්", "ලහිරු",
  "ඉසුරු", "දිල්ශාන්", "තිලින", "තිලිනි", "සඳුන්", "සඳුනි", "අශාන්", "විනුර",
  "හෙසර", "යෙනුලි", "සෙනුක", "බිනුර", "ලිහිනි", "නිර්මානි", "ප්‍රවීන්", "සංජය",
];

const UA = "HandahanaStudio/1.0 (name-usage-verify; +https://localhost)";

async function fetchText(url: string, ms = 12_000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "text/html,text/csv,*/*" },
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function normRoman(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function parseBehindthename(html: string): string[] {
  const out: string[] = [];
  const re = /href="\/name\/([a-z0-9-]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const n = normRoman(m[1].replace(/-/g, ""));
    if (n.length >= 2) out.push(n);
  }
  return out;
}

function parseWikiCountryNames(html: string, heading: string): string[] {
  const idx = html.indexOf(`>${heading}<`);
  if (idx < 0) return [];
  const slice = html.slice(idx, idx + 12_000);
  const names: string[] = [];
  const re = />([A-Z][a-z]+(?:[ -][A-Z][a-z]+)?)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(slice))) {
    const n = normRoman(m[1]);
    if (n.length >= 2 && n.length <= 14) names.push(n);
  }
  return names;
}

function parseBabyNamesCsv(csv: string, minYear = 2000): string[] {
  const counts = new Map<string, number>();
  for (const line of csv.split(/\n/).slice(1)) {
    // "year","name","percent","sex"
    const m = line.match(/^"?(\d{4})"?,"?([^"]+)"?,/);
    if (!m) continue;
    const year = Number(m[1]);
    if (year < minYear) continue;
    const n = normRoman(m[2]);
    if (!n) continue;
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2500)
    .map(([n]) => n);
}

function wikiHeading(country: LivingCountry): string | null {
  switch (country) {
    case "lk":
      return "Sri Lanka";
    case "au":
      return "Australia";
    case "uk":
      return "United Kingdom";
    case "us":
      return "United States";
    case "ca":
      return "Canada";
    case "in":
      return "India";
    case "sg":
      return "Singapore";
    case "ae":
      return "United Arab Emirates";
    default:
      return null;
  }
}

function fallbackPack(
  country: LivingCountry,
  language: NameLanguage,
): CurrentUsagePack {
  const roman = new Set(MODERN_LK_ROMAN.map(normRoman));
  // Seed Western commons for diaspora countries
  if (country !== "lk") {
    for (const n of [
      "oliver", "olivia", "noah", "emma", "liam", "amelia", "charlotte", "mia",
      "lucas", "sophia", "isla", "jack", "ava", "leo", "aria", "maya", "aiden",
      "elijah", "harper", "evelyn", "henry", "lucy", "theo", "grace",
    ]) {
      roman.add(n);
    }
  }
  return {
    country,
    language,
    sourceLabels: ["curated-modern-fallback"],
    roman,
    sinhala: new Set(MODERN_LK_SI),
    fetchedAt: Date.now(),
    live: false,
  };
}

export async function loadCurrentUsage(
  country: LivingCountry,
  language: NameLanguage = "bilingual",
): Promise<CurrentUsagePack> {
  const key = `${country}:${language}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.pack;

  const base = fallbackPack(country, language);
  const sourceLabels = [...base.sourceLabels];
  const roman = new Set(base.roman);
  const sinhala = new Set(base.sinhala);
  let live = false;

  const tasks: Array<Promise<void>> = [];

  // Sinhala / SL-leaning sources
  if (language === "si" || language === "bilingual" || country === "lk") {
    tasks.push(
      (async () => {
        const html = await fetchText(
          "https://www.behindthename.com/names/usage/sinhalese",
        );
        if (!html) return;
        for (const n of parseBehindthename(html)) roman.add(n);
        sourceLabels.push("behindthename:sinhalese");
        live = true;
      })(),
    );
  }

  // Country popularity tables (Wikipedia)
  const heading = wikiHeading(country);
  if (heading && (language === "en" || language === "bilingual" || country !== "lk")) {
    tasks.push(
      (async () => {
        const html = await fetchText(
          "https://en.wikipedia.org/wiki/List_of_most_popular_given_names",
        );
        if (!html) return;
        for (const n of parseWikiCountryNames(html, heading)) roman.add(n);
        sourceLabels.push(`wikipedia:popular:${heading}`);
        live = true;
      })(),
    );
  }

  // English-speaking recent generation corpus
  if (
    language === "en" ||
    language === "bilingual" ||
    ["au", "uk", "us", "ca", "sg", "ae", "other"].includes(country)
  ) {
    tasks.push(
      (async () => {
        const csv = await fetchText(
          "https://raw.githubusercontent.com/hadley/data-baby-names/master/baby-names.csv",
          20_000,
        );
        if (!csv) return;
        for (const n of parseBabyNamesCsv(csv, 1995)) roman.add(n);
        sourceLabels.push("github:hadley-baby-names:1995+");
        live = true;
      })(),
    );
  }

  await Promise.allSettled(tasks);

  const pack: CurrentUsagePack = {
    country,
    language,
    sourceLabels: [...new Set(sourceLabels)],
    roman,
    sinhala,
    fetchedAt: Date.now(),
    live,
  };
  cache.set(key, { pack, expires: Date.now() + TTL_MS });
  return pack;
}

export type UsageVerdict = {
  firstHit: boolean;
  middleHit: boolean;
  anyHit: boolean;
  boost: number;
  noteSi: string;
  noteEn: string;
};

export function verifyNameAgainstUsage(
  firstRoman: string,
  middleRoman: string,
  firstSi: string,
  middleSi: string,
  pack: CurrentUsagePack,
): UsageVerdict {
  const fr = normRoman(firstRoman);
  const mr = normRoman(middleRoman);
  const firstHit =
    pack.roman.has(fr) ||
    pack.sinhala.has(firstSi.trim()) ||
    [...pack.roman].some((n) => fr.startsWith(n) || n.startsWith(fr));
  const middleHit =
    pack.roman.has(mr) ||
    pack.sinhala.has(middleSi.trim()) ||
    [...pack.roman].some((n) => mr.startsWith(n) || n.startsWith(mr));
  const anyHit = firstHit || middleHit;
  let boost = 0;
  if (firstHit && middleHit) boost = 12;
  else if (firstHit) boost = 8;
  else if (middleHit) boost = 4;

  const countryLabel =
    pack.country === "lk"
      ? "ශ්‍රී ලංකාව"
      : pack.country.toUpperCase();

  return {
    firstHit,
    middleHit,
    anyHit,
    boost,
    noteSi: anyHit
      ? `වත්මන් පරම්පරා භාවිතය (${countryLabel}${pack.live ? " · web" : ""}) සමඟ ගැලපේ${firstHit ? " · මුල්" : ""}${middleHit ? " · මධ්‍ය" : ""}.`
      : `වත්මන් ${countryLabel} නාම ලැයිස්තුවේ සෘජු ගැලපීමක් නැත — අලුත්/දුර්ලභ යෝජනාවක් විය හැක.`,
    noteEn: anyHit
      ? `Matches current-generation usage in ${pack.country.toUpperCase()}${pack.live ? " (web-verified)" : ""}${firstHit ? " · first" : ""}${middleHit ? " · middle" : ""}.`
      : `No direct hit in current ${pack.country.toUpperCase()} name lists — may be rare/novel.`,
  };
}

/** Compact sample of current names for LLM prompts. */
export function usagePromptSample(pack: CurrentUsagePack, limit = 80): string {
  const sample = [...pack.roman].slice(0, limit).join(", ");
  return `CURRENT GENERATION NAMES IN USE (${pack.country}, sources: ${pack.sourceLabels.join("; ")}):\n${sample}`;
}
