/**
 * Assembles a traditional Sri Lankan කේන්ද්‍ර සටහන payload
 * (South-Indian Rashi + Navamsa, graha table, dasha, bhava).
 */

import { birthDay, civilWeekday } from "./birth-day";
import { vimshottari, splitDashaYears } from "./vimshottari";
import { computeChart, computeDetailedPanchang } from "vpv-panchangam";
import { findNekatha, namingLetterSet } from "./nakath-akshara";
import { resolvePlace } from "./places";
import { GRAHA, RASHI, BHAVA, rashiLabel, grahaLabel } from "./sinhala-names";
import type { BirthInput } from "./kendraya";
import {
  amPmSi,
  ayanaSi,
  drekkanaDivision,
  dwadashamsaDivision,
  formatIshta,
  genderBookletSi,
  grahaBalayaSi,
  grahaGathiSi,
  horaDivision,
  lunarMonthSi,
  nakshatraBookletAttrs,
  navamsaDivision,
  padaWord,
  rituSi,
  shakaYear,
  splitDms,
  trimshamsaDivision,
  weekdayShortSi,
} from "./booklet-fields";

const SIGN_ORDER = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

/** Short glyphs used inside කේන්ද්‍ර සටහන cells (SL booklet practice). */
export const GRAHA_GLYPH: Record<string, string> = {
  Lagna: "ල",
  Sun: "ර",
  Moon: "ච",
  Mars: "කු",
  Mercury: "බු",
  Jupiter: "ගු",
  Venus: "ශු",
  Saturn: "ශ",
  Rahu: "රා",
  Ketu: "කේ",
  Uranus: "යු",
  Neptune: "නැ",
  Pluto: "ප්ලූ",
};

const GRAHA_SI_FULL: Record<string, string> = {
  Lagna: "ලග්නය",
  Sun: "රවි",
  Moon: "චන්ද්‍ර",
  Mars: "කුජ",
  Mercury: "බුධ",
  Jupiter: "ගුරු",
  Venus: "ශුක්‍ර",
  Saturn: "ශනි",
  Rahu: "රාහු",
  Ketu: "කේතු",
  Uranus: "යුරේනස්",
  Neptune: "නෙප්චූන්",
  Pluto: "ප්ලූටෝ",
};

const WEEKDAY_SI = [
  "ඉරිදා",
  "සඳුදා",
  "අඟහරුවාදා",
  "බදාදා",
  "බ්‍රහස්පතින්දා",
  "සිකුරාදා",
  "සෙනසුරාදා",
];

const MONTH_SI = [
  "ජනවාරි",
  "පෙබරවාරි",
  "මාර්තු",
  "අප්‍රේල්",
  "මැයි",
  "ජූනි",
  "ජූලි",
  "අගෝස්තු",
  "සැප්තැම්බර්",
  "ඔක්තෝබර්",
  "නොවැම්බර්",
  "දෙසැම්බර්",
];

/** Common English → Sinhala labels for satahana meta row. */
const TITHI_SI: Record<string, string> = {
  Pratipada: "පෑලවිය",
  Dwitiya: "දියවක",
  Tritiya: "තියවක",
  Chaturthi: "ජතුරුවක",
  Panchami: "පස්වක",
  Shashthi: "සස්වක",
  Saptami: "සතවක",
  Ashtami: "අටවක",
  Navami: "නවවක",
  Dashami: "දසවක",
  Ekadashi: "එකොළොස්වක",
  Dwadashi: "දොළොස්වක",
  Trayodashi: "තෙළෙස්වක",
  Chaturdashi: "තුදුස්වක",
  Purnima: "පසලොස්වක",
  Amavasya: "අමාවක",
};

const KARANA_SI: Record<string, string> = {
  Bava: "බව",
  Balava: "බාලව",
  Kaulava: "කෞලව",
  Taitila: "තෛතිල",
  Garaja: "ගරජ",
  Vanija: "වණිජ",
  Vishti: "විෂ්ටි",
  Shakuni: "ශකුනි",
  Chatushpada: "චතුෂ්පාද",
  Naga: "නාග",
  Kimstughna: "කිංස්තුඝ්න",
};

const YOGA_SI: Record<string, string> = {
  Vishkambha: "විෂ්කම්භ",
  Priti: "ප්‍රීති",
  Ayushman: "ආයුෂ්මාන්",
  Saubhagya: "සෞභාග්‍ය",
  Sobhana: "ශෝභන",
  Atiganda: "අතිගණ්ඩ",
  Sukarma: "සුකර්ම",
  Dhriti: "ධෘති",
  Shula: "ශූල",
  Ganda: "ගණ්ඩ",
  Vriddhi: "වෘද්ධි",
  Dhruva: "ධ්‍රුව",
  Vyaghata: "ව්‍යාඝාත",
  Harshana: "හර්ෂණ",
  Vajra: "වජ්‍ර",
  Siddhi: "සිද්ධි",
  Vyatipata: "ව්‍යතීපාත",
  Variyan: "වරීයාන්",
  Parigha: "පරිඝ",
  Shiva: "ශිව",
  Siddha: "සිද්ධ",
  Sadhya: "සාධ්‍ය",
  Shubha: "ශුභ",
  Shukla: "ශුක්ල",
  Brahma: "බ්‍රහ්ම",
  Indra: "ඉන්ද්‍ර",
  Vaidhriti: "වෛධෘති",
};

function siLabel(map: Record<string, string>, en: string): string {
  if (!en) return "—";
  return map[en] ?? map[en.replace(/\s+/g, "")] ?? en;
}

function signIndex(name: string): number {
  const i = SIGN_ORDER.indexOf(name as (typeof SIGN_ORDER)[number]);
  return i >= 0 ? i : 0;
}

function navamsaSignIndex(longitude: number): number {
  const sign = Math.floor(((longitude % 360) + 360) % 360 / 30);
  const degInSign = ((longitude % 360) + 360) % 360 % 30;
  const pada = Math.min(8, Math.floor(degInSign / (30 / 9)));
  const movable = new Set([0, 3, 6, 9]);
  const fixed = new Set([1, 4, 7, 10]);
  let start: number;
  if (movable.has(sign)) start = sign;
  else if (fixed.has(sign)) start = (sign + 8) % 12;
  else start = (sign + 4) % 12;
  return (start + pada) % 12;
}

function formatDmsFromLon(lon: number): string {
  const x = ((lon % 360) + 360) % 360;
  const inSign = x % 30;
  const d = Math.floor(inSign);
  const mf = (inSign - d) * 60;
  const m = Math.floor(mf);
  const s = (mf - m) * 60;
  return `${d}° ${String(m).padStart(2, "0")}' ${s.toFixed(2).padStart(5, "0")}"`;
}

function formatAyanamsa(deg: number): string {
  const d = Math.floor(deg);
  const mf = (deg - d) * 60;
  const m = Math.floor(mf);
  const s = (mf - m) * 60;
  return `${d}° ${m}' ${s.toFixed(2)}"`;
}

function localHm(iso: string | undefined, tz: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function formatSiDate(isoOrYmd: string, tz = "Asia/Colombo"): string {
  const d = isoOrYmd.includes("T")
    ? new Date(isoOrYmd)
    : new Date(`${isoOrYmd}T12:00:00+05:30`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y} ${MONTH_SI[m - 1]} ${day}`;
}

/** Classical rashi dignity when ephemeris flags are missing (common for nodes). */
const EXALTATION: Record<string, number> = {
  Sun: 0, // Mesha
  Moon: 1, // Vrishabha
  Mars: 9, // Makara
  Mercury: 5, // Kanya
  Jupiter: 3, // Kataka
  Venus: 11, // Meena
  Saturn: 6, // Thula
  Rahu: 1, // Vrishabha (SL common)
  Ketu: 7, // Vrishchika (SL common)
};
const DEBILITATION: Record<string, number> = {
  Sun: 6,
  Moon: 7,
  Mars: 3,
  Mercury: 11,
  Jupiter: 9,
  Venus: 5,
  Saturn: 0,
  Rahu: 7,
  Ketu: 1,
};
const OWN_SIGNS: Record<string, number[]> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
};

function classicalDignity(name: string, signIdx: number): {
  exalted: boolean;
  debilitated: boolean;
  own_sign: boolean;
} {
  return {
    exalted: EXALTATION[name] === signIdx,
    debilitated: DEBILITATION[name] === signIdx,
    own_sign: (OWN_SIGNS[name] ?? []).includes(signIdx),
  };
}

function raBa(p: {
  name?: string;
  sign?: string;
  exalted: boolean;
  debilitated: boolean;
  own_sign: boolean;
  moolatrikona?: boolean;
}): string {
  const classic =
    p.name && p.sign != null
      ? classicalDignity(p.name, signIndex(p.sign))
      : null;
  const exalted = p.exalted || !!classic?.exalted;
  const debilitated = p.debilitated || !!classic?.debilitated;
  const own = p.own_sign || !!classic?.own_sign;
  if (exalted) return "උච්ච";
  if (debilitated) return "නීච";
  if (p.moolatrikona) return "මූල";
  if (own) return "ස්ව";
  return "—";
}

/** South-Indian fixed sign cell order → CSS grid positions */
export const SI_SIGN_CELLS: Array<{
  signIndex: number;
  row: number;
  col: number;
}> = [
  { signIndex: 11, row: 0, col: 0 }, // Pisces
  { signIndex: 0, row: 0, col: 1 }, // Aries
  { signIndex: 1, row: 0, col: 2 }, // Taurus
  { signIndex: 2, row: 0, col: 3 }, // Gemini
  { signIndex: 3, row: 1, col: 3 }, // Cancer
  { signIndex: 4, row: 2, col: 3 }, // Leo
  { signIndex: 5, row: 3, col: 3 }, // Virgo
  { signIndex: 6, row: 3, col: 2 }, // Libra
  { signIndex: 7, row: 3, col: 1 }, // Scorpio
  { signIndex: 8, row: 3, col: 0 }, // Sagittarius
  { signIndex: 9, row: 2, col: 0 }, // Capricorn
  { signIndex: 10, row: 1, col: 0 }, // Aquarius
];

type PlanetRow = {
  name: string;
  longitude: number;
  sign: string;
  sign_lord?: string;
  degree_in_sign: number;
  dms: string;
  nakshatra: string;
  nakshatra_pada: number;
  nakshatra_lord: string;
  house: number;
  exalted: boolean;
  debilitated: boolean;
  own_sign: boolean;
  moolatrikona?: boolean;
  retrograde: boolean;
  combust?: boolean;
  vargottama?: boolean;
  digbala?: boolean;
  pushkara_navamsa?: boolean;
  gandanta?: boolean;
  parivartana?: boolean;
  parivartana_with?: string | null;
};

function dignityFlags(p: PlanetRow): string {
  const flags: string[] = [];
  if (p.vargottama) flags.push("ව");
  if (p.combust) flags.push("දහ");
  if (p.digbala) flags.push("දිග්");
  if (p.pushkara_navamsa) flags.push("පුෂ්");
  if (p.gandanta) flags.push("ගණ්");
  if (p.parivartana) flags.push("පරි");
  return flags.join(" ") || "—";
}

function horaAtBirth(
  segments: Array<{ name: string; start: string; end: string }> | undefined,
  birthIso: string,
): string {
  if (!segments?.length) return "—";
  const t = new Date(birthIso).getTime();
  for (const s of segments) {
    const a = new Date(s.start).getTime();
    const b = new Date(s.end).getTime();
    if (t >= a && t < b) {
      return GRAHA_SI_FULL[s.name] ?? grahaLabel(s.name).sinhala;
    }
  }
  return "—";
}

function glyphsFromPlanetsBySign(
  planets: PlanetRow[],
  signIdx: number,
  lagnaGlyph: boolean,
): string[] {
  const glyphs: string[] = [];
  if (lagnaGlyph) glyphs.push(GRAHA_GLYPH.Lagna);
  for (const p of planets) {
    if (signIndex(p.sign) !== signIdx) continue;
    if (p.name === "Uranus" || p.name === "Pluto") continue;
    const g = GRAHA_GLYPH[p.name];
    if (g && !glyphs.includes(g)) glyphs.push(g);
  }
  return glyphs;
}

function resolvePlanetKey(n: string): string | null {
  if (n === "Su" || n === "Sun") return "Sun";
  if (n === "Mo" || n === "Moon") return "Moon";
  if (n === "Ma" || n === "Mars") return "Mars";
  if (n === "Me" || n === "Mercury") return "Mercury";
  if (n === "Ju" || n === "Jupiter") return "Jupiter";
  if (n === "Ve" || n === "Venus") return "Venus";
  if (n === "Sa" || n === "Saturn") return "Saturn";
  if (n === "Ra" || n === "Rahu") return "Rahu";
  if (n === "Ke" || n === "Ketu") return "Ketu";
  if (n === "Ur" || n === "Uranus") return "Uranus";
  if (n === "Ne" || n === "Neptune") return "Neptune";
  if (n === "Pl" || n === "Pluto") return "Pluto";
  if (GRAHA_GLYPH[n]) return n;
  return null;
}

/**
 * Glyphs for one house. Traditional booklet charts do not mark "ල" for lagna —
 * the center title already names the lagna / navamsha.
 */
function glyphsInSign(
  chart: Record<string, string[]>,
  houseNum: number,
  lagnaSignIndex: number,
  includeLagna: boolean,
): string[] {
  const glyphs: string[] = [];
  if (includeLagna && houseNum === 1) glyphs.push(GRAHA_GLYPH.Lagna);
  const occupants = chart[String(houseNum)] ?? [];
  const abbr = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke", "Ur", "Ne", "Pl"];
  const names = occupants.filter((x) => x.length > 2 || abbr.includes(x));
  const full = names.filter((n) => n.length > 2);
  const use = full.length ? full : names;
  for (const n of use) {
    const key = resolvePlanetKey(n);
    if (!key) continue;
    // Traditional Handahana charts usually omit Herschel/Pluto; Neptune (නැ) is kept.
    if (key === "Uranus" || key === "Pluto") continue;
    const g = GRAHA_GLYPH[key];
    if (g && !glyphs.includes(g)) glyphs.push(g);
  }
  void lagnaSignIndex;
  return glyphs;
}

export async function buildSatahana(input: BirthInput) {
  const place = resolvePlace(input);
  const date = input.date;
  const time = input.time.length === 5 ? input.time : input.time.slice(0, 5);

  const [raw, panchang] = await Promise.all([
    computeChart(
      {
        date,
        time,
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone,
        ayanamsa: input.ayanamsa ?? "lahiri",
      },
      "en",
    ),
    computeDetailedPanchang(
      date,
      place.latitude,
      place.longitude,
      place.timezone,
      "en",
    ),
  ]);

  const planets = raw.planets_data as PlanetRow[];
  const asc = raw.ascendant as PlanetRow & { dms: string; longitude: number; sign: string };
  const lagnaSignIdx = signIndex(asc.sign);
  const d9AscIdx = (raw.d9_chart.asc_sign as number) - 1;
  const d1 = raw.d1_chart.chart as Record<string, string[]>;
  const d9 = raw.d9_chart.chart as Record<string, string[]>;

  // Traditional booklet charts: no "ල" marker; rashi numbers 1–12; all graha incl. outer.
  const rashiCells = SI_SIGN_CELLS.map((cell) => {
    const houseNum = ((cell.signIndex - lagnaSignIdx + 12) % 12) + 1;
    return {
      ...cell,
      signEn: SIGN_ORDER[cell.signIndex],
      signSi: RASHI[SIGN_ORDER[cell.signIndex]]?.sinhala ?? SIGN_ORDER[cell.signIndex],
      rashiNum: cell.signIndex + 1,
      houseNum,
      isLagna: cell.signIndex === lagnaSignIdx,
      glyphs: glyphsInSign(d1, houseNum, lagnaSignIdx, false),
    };
  });

  const navamsaCells = SI_SIGN_CELLS.map((cell) => {
    const houseNum = ((cell.signIndex - d9AscIdx + 12) % 12) + 1;
    return {
      ...cell,
      signEn: SIGN_ORDER[cell.signIndex],
      signSi: RASHI[SIGN_ORDER[cell.signIndex]]?.sinhala ?? SIGN_ORDER[cell.signIndex],
      rashiNum: cell.signIndex + 1,
      houseNum,
      isLagna: cell.signIndex === d9AscIdx,
      glyphs: glyphsInSign(d9, houseNum, d9AscIdx, false),
    };
  });

  const planetOrder = [
    "Lagna",
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
    "Rahu",
    "Ketu",
    "Uranus",
    "Neptune",
    "Pluto",
  ];

  const byName = new Map(planets.map((p) => [p.name, p]));
  const moon = byName.get("Moon");
  const moonSignIdx = moon ? signIndex(moon.sign) : lagnaSignIdx;

  const chandraCells = SI_SIGN_CELLS.map((cell) => {
    const houseNum = ((cell.signIndex - moonSignIdx + 12) % 12) + 1;
    return {
      ...cell,
      signEn: SIGN_ORDER[cell.signIndex],
      signSi: RASHI[SIGN_ORDER[cell.signIndex]]?.sinhala ?? SIGN_ORDER[cell.signIndex],
      rashiNum: cell.signIndex + 1,
      houseNum,
      isLagna: cell.signIndex === moonSignIdx,
      glyphs: glyphsFromPlanetsBySign(planets, cell.signIndex, false),
    };
  });

  const grahaTable = planetOrder.map((name) => {
    if (name === "Lagna") {
      const nIdx = navamsaSignIndex(asc.longitude);
      const nek = findNekatha(asc.nakshatra);
      return {
        name,
        nameSi: GRAHA_SI_FULL.Lagna,
        glyph: GRAHA_GLYPH.Lagna,
        rashiEn: asc.sign,
        rashiSi: rashiLabel(asc.sign).sinhala,
        rashiLordSi: GRAHA_SI_FULL[asc.sign_lord ?? rashiLabel(asc.sign).lord] ??
          grahaLabel(asc.sign_lord ?? rashiLabel(asc.sign).lord).sinhala,
        raBa: "—",
        flags: "—",
        navamsaEn: SIGN_ORDER[nIdx],
        navamsaSi: RASHI[SIGN_ORDER[nIdx]]?.sinhala ?? SIGN_ORDER[nIdx],
        bhava: 1,
        sphuta: asc.dms,
        longitude: Number(asc.longitude.toFixed(6)),
        nekathaSi: nek.spoken,
        nekathaEn: nek.english,
        nekathaFullSi: nek.sinhala,
        pada: asc.nakshatra_pada,
        nekathaLordSi: grahaLabel(asc.nakshatra_lord).sinhala,
        nekathaLordEn: asc.nakshatra_lord,
      };
    }
    const p = byName.get(name) as PlanetRow | undefined;
    if (!p) {
      return {
        name,
        nameSi: GRAHA_SI_FULL[name] ?? name,
        glyph: GRAHA_GLYPH[name] ?? name,
        rashiEn: "—",
        rashiSi: "—",
        rashiLordSi: "—",
        raBa: "—",
        flags: "—",
        navamsaEn: "—",
        navamsaSi: "—",
        bhava: 0,
        sphuta: "—",
        longitude: 0,
        nekathaSi: "—",
        nekathaEn: "—",
        nekathaFullSi: "—",
        pada: 0,
        nekathaLordSi: "—",
        nekathaLordEn: "—",
      };
    }
    const nIdx = navamsaSignIndex(p.longitude);
    const nek = findNekatha(p.nakshatra);
    return {
      name,
      nameSi: GRAHA_SI_FULL[name] ?? grahaLabel(name).sinhala,
      glyph: GRAHA_GLYPH[name] ?? name.slice(0, 2),
      rashiEn: p.sign,
      rashiSi: rashiLabel(p.sign).sinhala,
      rashiLordSi:
        GRAHA_SI_FULL[p.sign_lord ?? rashiLabel(p.sign).lord] ??
        grahaLabel(p.sign_lord ?? rashiLabel(p.sign).lord).sinhala,
      raBa: raBa({ ...p, name, sign: p.sign }),
      flags: dignityFlags(p),
      navamsaEn: SIGN_ORDER[nIdx],
      navamsaSi: RASHI[SIGN_ORDER[nIdx]]?.sinhala ?? SIGN_ORDER[nIdx],
      bhava: p.house,
      sphuta: p.dms,
      longitude: Number(p.longitude.toFixed(6)),
      nekathaSi: nek.spoken,
      nekathaEn: nek.english,
      nekathaFullSi: nek.sinhala,
      pada: p.nakshatra_pada,
      nekathaLordSi: grahaLabel(p.nakshatra_lord).sinhala,
      nekathaLordEn: p.nakshatra_lord,
      retrograde: p.retrograde,
    };
  });

  // Whole-sign bhava cusps from lagna sign
  const bhavaRows = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    const signIdx = (lagnaSignIdx + i) % 12;
    const startLon = signIdx * 30;
    const midLon = startLon + 15;
    const endLon = startLon + 30;
    const nekIdx = Math.floor(midLon / (360 / 27));
    const nekathaFromTable = findNekathaByIndex(nekIdx + 1);
    const occupants = grahaTable
      .filter((g) => g.name !== "Lagna" && g.bhava === h)
      .map((g) => g.nameSi);
    return {
      bhava: h,
      start: formatDmsFromLon(startLon),
      mid: formatDmsFromLon(midLon),
      end: formatDmsFromLon(endLon % 360 === 0 && endLon > 0 ? 0 : endLon),
      midNekatha: nekathaFromTable.spoken,
      midNekathaEn: nekathaFromTable.english,
      occupants: occupants.join(", ") || "—",
      signSi: RASHI[SIGN_ORDER[signIdx]]?.sinhala ?? "",
    };
  });

  if (!moon) throw new Error("Moon position missing");
  const dasha = vimshottari(moon.longitude, raw.birth.utc_time);
  const maha = dasha.maha.map((d, i) => ({
    index: i + 1,
    lord: d.lord,
    lordSi: GRAHA_SI_FULL[d.lord] ?? grahaLabel(d.lord).sinhala,
    start: d.start,
    startSi: formatSiDate(d.start, place.timezone),
    end: d.end,
    endSi: formatSiDate(d.end, place.timezone),
    years: Number(d.years.toFixed(4)),
  }));

  const antarBlock = { lord: dasha.maha[0].lord };
  const antar = dasha.antar.map((a, i) => ({
    index: i + 1,
    lord: a.lord,
    lordSi: GRAHA_SI_FULL[a.lord] ?? grahaLabel(a.lord).sinhala,
    start: a.start,
    startSi: formatSiDate(a.start, place.timezone),
    end: a.end,
    endSi: formatSiDate(a.end, place.timezone),
    years: Number(a.years.toFixed(4)),
  }));

  const bal = splitDashaYears(dasha.balanceYears);
  const day = await birthDay(date, raw.birth.utc_time, place.latitude, place.longitude, place.timezone, panchang);

  const sunMoon = panchang.sun_moon as {
    sunrise?: string;
    sunset?: string;
  };
  const pan = day.panchang as {
    tithi?: { name?: string; ends_at?: string } | string;
    nakshatra?: { name?: string; pada?: number; ends_at?: string } | string;
    yoga?: { name?: string; ends_at?: string } | string;
    karana?: { name?: string; ends_at?: string } | string;
    paksha?: string;
  };
  const vara = panchang.vara as { index?: number; english?: string; sanskrit?: string };

  const tithiObj = typeof pan.tithi === "object" && pan.tithi ? pan.tithi : null;
  const yogaObj = typeof pan.yoga === "object" && pan.yoga ? pan.yoga : null;
  const karanaObj = typeof pan.karana === "object" && pan.karana ? pan.karana : null;
  const panNak =
    typeof pan.nakshatra === "object" && pan.nakshatra
      ? pan.nakshatra
      : { name: String(pan.nakshatra ?? ""), pada: 0, ends_at: undefined };

  const tithiName = tithiObj ? String(tithiObj.name ?? "") : String(pan.tithi ?? "");
  const yogaName = yogaObj ? String(yogaObj.name ?? "") : String(pan.yoga ?? "");
  const karanaName = karanaObj
    ? String(karanaObj.name ?? "")
    : String(pan.karana ?? "");

  const moonNek = moon ? findNekatha(moon.nakshatra) : null;
  const letterSet = moon
    ? namingLetterSet(moon.nakshatra, moon.nakshatra_pada)
    : null;

  const weekdayIdx = civilWeekday(date);

  const drekkana22Lord = drekkanaLord(asc.longitude);
  const navamsa64Lord = navamsaLordFromLon(moon?.longitude ?? asc.longitude);

  const birthUtc = String(raw.birth.utc_time ?? `${date}T${time}:00+05:30`);
  const horaDay = (day.hora as { day?: Array<{ name: string; start: string; end: string }> })
    ?.day;
  const horaNight = (day.hora as { night?: Array<{ name: string; start: string; end: string }> })
    ?.night;
  const birthHora = (() => {
    const h = horaAtBirth(horaDay, birthUtc);
    if (h !== "—") return h;
    return horaAtBirth(horaNight, birthUtc);
  })();

  const sav = (raw.ashtakavarga as { sav?: number[] })?.sav ?? [];
  const ashtakavarga = SIGN_ORDER.map((sign, i) => ({
    signEn: sign,
    signSi: RASHI[sign]?.sinhala ?? sign,
    bindu: sav[i] ?? 0,
  }));

  const aspects = (
    (raw.drishti as unknown as { aspects?: Array<Record<string, unknown>> })
      ?.aspects ?? []
  )
    .filter((a) => Number(a.strength) >= 75)
    .slice(0, 18)
    .map((a) => ({
      fromSi: GRAHA_SI_FULL[String(a.planet)] ?? String(a.planet),
      toHouse: Number(a.to_house),
      offset: Number(a.offset),
      benefic: Boolean(a.benefic),
      detailSi: `${GRAHA_SI_FULL[String(a.planet)] ?? a.planet} → භාව ${a.to_house} (${a.offset})`,
    }));

  const karakas = (
    (raw.karakas as Array<{
      abbr: string;
      title: string;
      planet: string;
      sign: string;
      dms: string;
    }>) ?? []
  ).map((k) => ({
    abbr: k.abbr,
    title: k.title,
    planetSi: GRAHA_SI_FULL[k.planet] ?? grahaLabel(k.planet).sinhala,
    rashiSi: rashiLabel(k.sign).sinhala,
    sphuta: k.dms,
  }));

  const kalsarpa = raw.kalsarpa as {
    present: boolean;
    verdict: string;
    kind: string | null;
    rahu_house: number;
    ketu_house: number;
  };

  const genderSi =
    input.gender === "male"
      ? "පුරුෂ"
      : input.gender === "female"
        ? "ස්ත්‍රී"
        : "—";

  const pakshaSi =
    String(pan.paksha ?? "").toLowerCase().includes("krishna")
      ? "කෘෂ්ණ පක්ෂ"
      : String(pan.paksha ?? "").toLowerCase().includes("shukla")
        ? "ශුක්ල පක්ෂ"
        : pan.paksha ?? "—";

  const bhavaRowsEnriched = bhavaRows.map((b) => ({
    ...b,
    themes: BHAVA[b.bhava]?.themes ?? "",
    themesSi: BHAVA[b.bhava]?.sinhala ?? "",
  }));

  const sun = byName.get("Sun");
  const sunLon = sun?.longitude ?? 0;
  const moonLon = moon?.longitude ?? 0;
  const sunSignIdx = sun ? signIndex(sun.sign) : 0;
  const nekIdx = moonNek?.index ?? 1;
  const attrs = nakshatraBookletAttrs(nekIdx);
  const genderBook = genderBookletSi(input.gender);
  const ceYear = Number(date.slice(0, 4));
  const ceMonth = Number(date.slice(5, 7));
  const ceDay = Number(date.slice(8, 10));
  const birthJsDay = day.weekday;
  const ishta = formatIshta(day.sunrise, birthUtc);
  const lagnaDms = splitDms(asc.dms);
  const horaDiv = horaDivision(asc.longitude);
  const drekDiv = drekkanaDivision(asc.longitude);
  const navDiv = navamsaDivision(asc.longitude);
  const dwaDiv = dwadashamsaDivision(asc.longitude);
  const triDiv = trimshamsaDivision(asc.longitude);
  const pakshaShort = pakshaSi.includes("කෘෂ්ණ") ? "අව" : "පුර";

  // Thrivara likhitha — nakshatra/tithi ends for yesterday / today / tomorrow
  const thrivaraDates = [-1, 0, 1].map((off) => {
    const d = new Date(`${date}T12:00:00+05:30`);
    d.setDate(d.getDate() + off);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const thrivaraPans = await Promise.all(
    thrivaraDates.map((d) =>
      computeDetailedPanchang(
        d,
        place.latitude,
        place.longitude,
        place.timezone,
        "en",
      ),
    ),
  );
  const thrivara = thrivaraPans.map((tp, i) => {
    const panT = tp.panchang as {
      tithi?: { name?: string; ends_at?: string } | string;
      nakshatra?: { name?: string; ends_at?: string } | string;
    };
    const varaT = tp.vara as { index?: number };
    const tObj =
      typeof panT.tithi === "object" && panT.tithi ? panT.tithi : null;
    const nObj =
      typeof panT.nakshatra === "object" && panT.nakshatra
        ? panT.nakshatra
        : null;
    const tName = tObj ? String(tObj.name ?? "") : String(panT.tithi ?? "");
    const nName = nObj
      ? String(nObj.name ?? "")
      : String(panT.nakshatra ?? "");
    let nekSpoken = nName;
    try {
      nekSpoken = findNekatha(nName).spoken;
    } catch {
      /* keep English name if alias missing */
    }
    const wd =
      typeof varaT.index === "number"
        ? WEEKDAY_SI[((varaT.index % 7) + 7) % 7]
        : WEEKDAY_SI[new Date(`${thrivaraDates[i]}T12:00:00+05:30`).getDay()];
    const nEnd = localHm(nObj?.ends_at, place.timezone);
    const tEnd = localHm(tObj?.ends_at, place.timezone);
    const [nH, nM] = nEnd.includes(":")
      ? nEnd.split(":")
      : ["—", "—"];
    const [tH, tM] = tEnd.includes(":")
      ? tEnd.split(":")
      : ["—", "—"];
    return {
      date: thrivaraDates[i],
      dateSi: `${Number(thrivaraDates[i].slice(8, 10))} ${wd}`,
      nekathaSi: nekSpoken,
      nekathaHours: nH,
      nekathaMinutes: nM,
      tithiSi: siLabel(TITHI_SI, tName),
      tithiHours: tH,
      tithiMinutes: tM,
    };
  });

  // Sunrise reference for Colombo vs birth place (Asgiri/Kandy style dual row)
  const colomboPan = await computeDetailedPanchang(
    date,
    6.9271,
    79.8612,
    "Asia/Colombo",
    "en",
  );
  const colomboSun = colomboPan.sun_moon as {
    sunrise?: string;
  };
  const colomboSunrise = localHm(colomboSun.sunrise, "Asia/Colombo");
  const placeSunrise = localHm(sunMoon.sunrise, place.timezone);

  const grahaTaththwaya = grahaTable
    .filter((g) => g.name !== "Lagna")
    .map((g) => {
      const p = byName.get(g.name) as PlanetRow | undefined;
      return {
        nameSi: g.nameSi,
        bhava: g.bhava ? String(g.bhava).padStart(2, "0") : "—",
        rashiSi: g.rashiSi,
        balayaSi: p
          ? grahaBalayaSi({ ...p, name: g.name, sign: p.sign })
          : g.raBa === "—"
            ? "සම"
            : g.raBa === "උච්ච" || g.raBa === "නීච"
              ? g.raBa
              : g.raBa === "ස්ව"
                ? "ස්වක්ෂේත්‍ර"
                : "සම",
        gathiSi: grahaGathiSi(Boolean(g.retrograde)),
      };
    });

  const booklet = {
    shakaYear: shakaYear(ceYear),
    ayanaSi: ayanaSi(sunLon),
    rituSi: rituSi(sunSignIdx),
    sunRashiSi: sun ? rashiLabel(sun.sign).sinhala : "—",
    sunBhaga: Math.floor((((sunLon % 360) + 360) % 360) % 30),
    lunarMonthSi: lunarMonthSi(moonLon),
    pakshaShort,
    tithiSi: siLabel(TITHI_SI, tithiName),
    weekdayShortSi: weekdayShortSi(birthJsDay),
    weekdaySi: WEEKDAY_SI[day.weekday] ?? "",
    civilWeekdaySi: WEEKDAY_SI[weekdayIdx],
    vedicDate: day.vedicDate,
    ishtaSunriseUtc: day.sunrise ?? null,
    ishta,
    ceYear,
    ceMonthSi: MONTH_SI[ceMonth - 1] ?? "",
    ceDay,
    timeAmPmSi: amPmSi(time.length >= 5 ? time.slice(0, 5) : time),
    lagnaLordSi:
      GRAHA_SI_FULL[asc.sign_lord ?? rashiLabel(asc.sign).lord] ??
      grahaLabel(asc.sign_lord ?? rashiLabel(asc.sign).lord).sinhala,
    lagnaRashiSi: rashiLabel(asc.sign).sinhala,
    hora: horaDiv,
    drekkana: drekDiv,
    navamsa: navDiv,
    dwadashamsa: dwaDiv,
    trimshamsa: triDiv,
    yogaSi: siLabel(YOGA_SI, yogaName),
    karanaSi: siLabel(KARANA_SI, karanaName),
    padaWord: padaWord(moon?.nakshatra_pada ?? 1),
    lon: place.longitude.toFixed(2),
    lat: place.latitude.toFixed(2),
    roleSi: genderBook.roleSi,
    genderSi: genderBook.genderSi,
    ...attrs,
    dashaBalance: {
      lordSi: maha[0]?.lordSi ?? "—",
      years: bal.y,
      months: bal.m,
      days: bal.d,
    },
    lagnaSphuta: lagnaDms,
    sunriseColombo: colomboSunrise,
    sunrisePlace: placeSunrise,
    sunrisePlaceLabel: place.label.includes("Kandy")
      ? "මහනුවර - ඇස්ගිරි"
      : place.label,
    thrivara,
    grahaTaththwaya,
    birthNarrative: {
      year: ceYear,
      monthSi: MONTH_SI[ceMonth - 1] ?? "",
      day: ceDay,
      weekdaySi: WEEKDAY_SI[weekdayIdx] ?? "",
      hours: time.slice(0, 2),
      minutes: time.slice(3, 5),
      place: place.label,
    },
  };

  return {
    blessing:
      "අරහං සම්මාසම්බුද්ධෝ භගවා · බුද්ධං භගවන්තං අභිවාදෙමි",
    titleSi: "කේන්ද්‍ර සටහන",
    titleEn: "Kendraya Satahana",
    subtitleSi: "සම්පූර්ණ හඳහන · ලහිරි අයනාංශ · Swiss Ephemeris",
    native: {
      name: input.nativeName ?? null,
      gender: input.gender ?? "unspecified",
      genderSi,
      date,
      dateSi: formatSiDate(date, place.timezone),
      timeLocal: time.length === 5 ? `${time}:00` : time,
      timezone: place.timezone,
      tzOffset: "+05:30",
      placeLabel: place.label,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      julianDay: Number(raw.birth.julian_day?.toFixed?.(4) ?? raw.birth.julian_day),
      utcTime: raw.birth.utc_time,
    },
    meta: {
      weekdaySi: WEEKDAY_SI[weekdayIdx] ?? vara.english ?? "",
      weekdayEn: vara.english ?? "",
      vedicWeekdaySi: WEEKDAY_SI[day.weekday],
      vedicWeekdayEn: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day.weekday],
      vedicDate: day.vedicDate,
      tithi: siLabel(TITHI_SI, tithiName),
      tithiEn: tithiName,
      tithiEnds: localHm(tithiObj?.ends_at, place.timezone),
      nekathaSi: moonNek?.spoken ?? String(panNak.name ?? ""),
      nekathaFullSi: moonNek?.sinhala ?? "",
      nekathaEn: moonNek?.english ?? String(panNak.name ?? ""),
      pada: moon?.nakshatra_pada ?? panNak.pada ?? 0,
      nekathaEnds: localHm(panNak.ends_at, place.timezone),
      karana: siLabel(KARANA_SI, karanaName),
      karanaEn: karanaName,
      yoga: yogaName,
      yogaEnds: localHm(yogaObj?.ends_at, place.timezone),
      hora: birthHora,
      sunrise: localHm(sunMoon.sunrise, place.timezone),
      sunset: localHm(sunMoon.sunset, place.timezone),
      ayanamsa: formatAyanamsa(raw.birth.ayanamsa),
      ayanamsaLabel: "Lahiri (Chitrapaksha)",
      drekkana22LordSi: GRAHA_SI_FULL[drekkana22Lord] ?? drekkana22Lord,
      navamsa64LordSi: GRAHA_SI_FULL[navamsa64Lord] ?? navamsa64Lord,
      paksha: pakshaSi,
      lagnaLordSi:
        GRAHA_SI_FULL[asc.sign_lord ?? rashiLabel(asc.sign).lord] ??
        grahaLabel(asc.sign_lord ?? rashiLabel(asc.sign).lord).sinhala,
      chandraLordSi: moon
        ? GRAHA_SI_FULL[moon.sign_lord ?? rashiLabel(moon.sign).lord] ??
          grahaLabel(moon.sign_lord ?? rashiLabel(moon.sign).lord).sinhala
        : "—",
    },
    rashiChart: {
      centerTitleSi: `${rashiLabel(asc.sign).sinhala} ලග්නය`,
      centerTitleEn: `${asc.sign} Lagna`,
      degree: asc.dms,
      cells: rashiCells,
    },
    navamsaChart: {
      centerTitleSi: `${RASHI[SIGN_ORDER[d9AscIdx]]?.sinhala ?? ""} නවාංශකය`,
      centerTitleEn: `${SIGN_ORDER[d9AscIdx]} Navamsa`,
      degree: formatDmsFromLon(
        (raw.d9_chart.planet_degrees as Record<string, number>)?.As ??
          (raw.d9_chart.planet_degrees as Record<string, number>)?.Asc ??
          navamsaDegreeInSign(asc.longitude),
      ),
      cells: navamsaCells,
    },
    chandraChart: {
      centerTitleSi: `${moon ? rashiLabel(moon.sign).sinhala : "—"} චන්ද්‍ර කුණ්ඩලී`,
      centerTitleEn: "Chandra Kundali",
      degree: moon?.dms ?? "—",
      cells: chandraCells,
    },
    grahaTable,
    namThebima: letterSet
      ? {
          primarySi: letterSet.primary.sinhala,
          primaryRoman: letterSet.primary.roman,
          allLetters: letterSet.allRecommendedSinhala,
          avoid: letterSet.avoidTara.map((t) => t.spoken),
          guidanceSi:
            "නමේ පළමු ශබ්දය චන්ද්‍ර පාද අකුරට ගැලපේ යුතුය. රාහු කාලයේ නම් තැබීම නොකරන්න.",
        }
      : null,
    karakas,
    ashtakavarga,
    aspects,
    yogas: {
      kalsarpaPresent: Boolean(kalsarpa.present),
      kalsarpaVerdict: String(kalsarpa.verdict),
      kalsarpaKind: kalsarpa.kind,
      rahuHouse: kalsarpa.rahu_house,
      ketuHouse: kalsarpa.ketu_house,
      karakamsa: String(raw.karakamsa ?? ""),
      swamsa: String(raw.swamsa ?? ""),
    },
    mahaDasha: maha,
    antarDasha: antar,
    antarMahaLordSi: GRAHA_SI_FULL[antarBlock?.lord ?? ""] ?? antarBlock?.lord ?? "",
    dashaConvention: { yearDays: dasha.yearDays, elapsedFraction: dasha.elapsedFraction, balanceYears: dasha.balanceYears },
    dashaBalanceSi: `${maha[0]?.lordSi ?? ""}ගේ විංශෝත්තරී මහා දශා ශේෂය අවුරුදු ${bal.y}යි මාස ${bal.m}යි දින ${bal.d}`,
    dashaBalanceEn: `Vimshottari ${maha[0]?.lord ?? ""} balance: ${bal.y}y ${bal.m}m ${bal.d}d`,
    bhavaRows: bhavaRowsEnriched,
    legendSi:
      "රා.බ.=රාශි බලය (උච්ච/නීච/ස්ව/මූල) · ධජ: ව=වර්ගෝත්තම, දහ=දහනය, දිග්=දිග්බල, පුෂ්=පුෂ්කර නවාංශ, ගණ්=ගණ්ඩාන්ත, පරි=පරිවර්තන · (ව)=වක්‍ර",
    footerSi:
      "ශ්‍රී ග්‍රහ මස්තු! · හඳහන ස්ටූඩියෝ — සම්ප්‍රදායික කේන්ද්‍ර පොත් ආකෘතිය · Lahiri · Swiss Ephemeris",
    footerEn: "Complete Kendraya Satahana — Handahana Studio",
    booklet,
  };
}

function findNekathaByIndex(index: number) {
  try {
    // reuse table via english names order
    const names = [
      "Ashwini",
      "Bharani",
      "Krittika",
      "Rohini",
      "Mrigashira",
      "Ardra",
      "Punarvasu",
      "Pushya",
      "Ashlesha",
      "Magha",
      "Purva Phalguni",
      "Uttara Phalguni",
      "Hasta",
      "Chitra",
      "Swati",
      "Vishakha",
      "Anuradha",
      "Jyeshtha",
      "Mula",
      "Purva Ashadha",
      "Uttara Ashadha",
      "Shravana",
      "Dhanishta",
      "Shatabhisha",
      "Purva Bhadrapada",
      "Uttara Bhadrapada",
      "Revati",
    ];
    const i = ((index - 1) % 27 + 27) % 27;
    return findNekatha(names[i]);
  } catch {
    return { spoken: "—", english: "—" };
  }
}

function drekkanaLord(lon: number): string {
  const sign = Math.floor((((lon % 360) + 360) % 360) / 30);
  const deg = (((lon % 360) + 360) % 360) % 30;
  const third = Math.min(2, Math.floor(deg / 10));
  const drekSign = (sign + third * 4) % 12;
  return RASHI[SIGN_ORDER[drekSign]]?.lord ?? "—";
}

function navamsaLordFromLon(lon: number): string {
  const idx = navamsaSignIndex(lon);
  return RASHI[SIGN_ORDER[idx]]?.lord ?? "—";
}

function navamsaDegreeInSign(lon: number): number {
  const degInSign = (((lon % 360) + 360) % 360) % 30;
  const padaSpan = 30 / 9;
  return (degInSign % padaSpan) * 9;
}

// silence unused import warning for GRAHA if only used indirectly
void GRAHA;
