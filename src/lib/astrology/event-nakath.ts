/**
 * Event-category suitable nakath (nakshatra) finder for a given horoscope.
 *
 * Combines:
 * 1. Classical event-preferred / avoided nakshatras (SL Handahana practice)
 * 2. Tara balam from the native's janma nekatha
 *
 * Modes:
 * - catalogue: list suitable nakaths to "bring in" for an event
 * - check: evaluate one user-picked date
 * - scan: find relevant dates in a range for the event
 */

import type { BirthInput } from "@/lib/astrology/kendraya";
import { castKendraya } from "@/lib/astrology/kendraya";
import {
  EVENT_CATEGORIES,
  eventById,
  listEventCategories,
  type EventCategory,
  type EventCategoryId,
} from "@/lib/astrology/event-categories";
import {
  NEKATHA_TABLE,
  TARA_CLASSES,
  findNekatha,
  taraCycleFromJanma,
  type NekathaRow,
} from "@/lib/astrology/nakath-akshara";
import { computeMuhurta } from "@/lib/astrology/muhurta";
import { getPanchanga } from "@/lib/astrology/panchanga";

export type { EventCategory, EventCategoryId };
export { EVENT_CATEGORIES, eventById, listEventCategories };

export type TaraInfo = {
  classKey: (typeof TARA_CLASSES)[number]["key"];
  classSinhala: string;
  favourForNaming: boolean;
  offset: number;
};

export function taraForNakshatra(
  janmaIndex: number,
  dayNekathaIndex: number,
): TaraInfo {
  const offset = (dayNekathaIndex - janmaIndex + 27) % 27;
  const taraOffset = offset % 9;
  const cls = TARA_CLASSES[taraOffset];
  return {
    classKey: cls.key,
    classSinhala: cls.sinhala,
    favourForNaming: cls.favourForNaming,
    offset: taraOffset,
  };
}

export type NakathOption = {
  english: string;
  sinhala: string;
  spoken: string;
  index: number;
  eventFit: "prefer" | "ok" | "avoid";
  tara: TaraInfo;
  score: number;
  reasonsEn: string[];
  reasonsSi: string[];
};

function rowByEnglish(name: string): NekathaRow {
  return findNekatha(name);
}

export function scoreNakathForEvent(
  nekathaEnglish: string,
  janmaIndex: number,
  event: EventCategory,
): NakathOption {
  const row = rowByEnglish(nekathaEnglish);
  const tara = taraForNakshatra(janmaIndex, row.index);
  const reasonsEn: string[] = [];
  const reasonsSi: string[] = [];
  let score = 55;
  let eventFit: NakathOption["eventFit"] = "ok";

  const preferSet = new Set(event.prefer.map((n) => n.toLowerCase()));
  const avoidSet = new Set(event.avoid.map((n) => n.toLowerCase()));
  const key = row.english.toLowerCase();

  if (preferSet.has(key)) {
    eventFit = "prefer";
    score += 22;
    reasonsEn.push("Listed as preferred for this event");
    reasonsSi.push("මෙම අවස්ථාවට නිර්දේශිත නැකතකි");
  } else if (avoidSet.has(key)) {
    eventFit = "avoid";
    score -= 35;
    reasonsEn.push("Traditionally avoided for this event");
    reasonsSi.push("මෙම අවස්ථාවට සාම්ප්‍රදායිකව වළකින නැකතකි");
  } else {
    reasonsEn.push("Neutral for event list — rely on tara balam");
    reasonsSi.push("අවස්ථා ලැයිස්තුවේ මධ්‍යස්ථ — තාරා බලය බලන්න");
  }

  if (tara.favourForNaming) {
    score += 18;
    reasonsEn.push(`Favourable tara: ${tara.classKey} (${tara.classSinhala})`);
    reasonsSi.push(`සුභ තාරා: ${tara.classSinhala}`);
  } else {
    score -= 22;
    reasonsEn.push(`Challenging tara: ${tara.classKey} (${tara.classSinhala})`);
    reasonsSi.push(`අසුභ තාරා: ${tara.classSinhala}`);
  }

  if (event.avoidJanmaTara && tara.classKey === "janma") {
    score -= 15;
    reasonsEn.push("Janma tara often avoided for this event");
    reasonsSi.push("මෙම අවස්ථාවට ජන්ම තාරා බොහෝ විට වළකී");
  }

  score = Math.max(0, Math.min(100, score));
  return {
    english: row.english,
    sinhala: row.sinhala,
    spoken: row.spoken,
    index: row.index,
    eventFit,
    tara,
    score,
    reasonsEn,
    reasonsSi,
  };
}

export function catalogueForEvent(
  janmaIndex: number,
  eventId: EventCategoryId,
): {
  event: EventCategory;
  options: NakathOption[];
  bringIn: NakathOption[];
} {
  const event = eventById(eventId);
  const options = NEKATHA_TABLE.map((n) =>
    scoreNakathForEvent(n.english, janmaIndex, event),
  ).sort((a, b) => b.score - a.score || a.index - b.index);
  const bringIn = options.filter(
    (o) => o.score >= 65 && o.eventFit !== "avoid",
  );
  return { event, options, bringIn };
}

function parseYmd(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = parseYmd(date);
  d.setUTCDate(d.getUTCDate() + days);
  return formatYmd(d);
}

function daysBetween(from: string, to: string): number {
  const a = parseYmd(from).getTime();
  const b = parseYmd(to).getTime();
  return Math.round((b - a) / 86400000);
}

function dayNakshatraName(
  pan: Awaited<ReturnType<typeof getPanchanga>>,
): string {
  const n = (pan.panchang as { nakshatra?: { name?: string; index?: number } })
    ?.nakshatra;
  if (n?.name) return String(n.name);
  throw new Error("Panchanga nakshatra missing for date");
}

export type DateSuitability = {
  date: string;
  weekdayEn: string;
  weekdaySi: string;
  dayNakshatra: NakathOption;
  suitable: boolean;
  grade: "excellent" | "good" | "caution" | "avoid";
  rahuKalaya?: { start: string; end: string };
  summaryEn: string;
  summarySi: string;
};

function gradeFromScore(score: number): DateSuitability["grade"] {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 45) return "caution";
  return "avoid";
}

export async function checkEventDate(input: {
  birth: BirthInput;
  eventId: EventCategoryId;
  date: string;
  placeId?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}): Promise<{
  native: { janmaNekatha: string; janmaNekathaSi: string; janmaIndex: number };
  event: EventCategory;
  catalogue: NakathOption[];
  bringIn: NakathOption[];
  day: DateSuitability;
  taraCycle: ReturnType<typeof taraCycleFromJanma>;
}> {
  const chart = await castKendraya(input.birth);
  const janma = findNekatha(chart.chandra.nekatha);
  const event = eventById(input.eventId);
  const cat = catalogueForEvent(janma.index, input.eventId);

  const place = {
    placeId: input.placeId ?? input.birth.placeId,
    placeName: input.placeName ?? input.birth.placeName,
    latitude: input.latitude ?? input.birth.latitude,
    longitude: input.longitude ?? input.birth.longitude,
    timezone: input.timezone ?? input.birth.timezone,
  };

  const [pan, muh] = await Promise.all([
    getPanchanga({ date: input.date, ...place }),
    computeMuhurta({ date: input.date, ...place }),
  ]);
  const dayName = dayNakshatraName(pan);
  const dayNakshatra = scoreNakathForEvent(dayName, janma.index, event);
  const grade = gradeFromScore(dayNakshatra.score);
  const suitable = grade === "excellent" || grade === "good";

  return {
    native: {
      janmaNekatha: janma.english,
      janmaNekathaSi: janma.spoken,
      janmaIndex: janma.index,
    },
    event,
    catalogue: cat.options,
    bringIn: cat.bringIn,
    taraCycle: taraCycleFromJanma(janma.index),
    day: {
      date: input.date,
      weekdayEn: muh.weekdayEn,
      weekdaySi: muh.weekdaySi,
      dayNakshatra,
      suitable,
      grade,
      rahuKalaya: {
        start: muh.rahuKalaya.start,
        end: muh.rahuKalaya.end,
      },
      summaryEn: suitable
        ? `${input.date} Moon in ${dayNakshatra.english} looks ${grade} for ${event.en} (score ${dayNakshatra.score}). Avoid Rahu ${muh.rahuKalaya.start}–${muh.rahuKalaya.end}.`
        : `${input.date} Moon in ${dayNakshatra.english} is ${grade} for ${event.en} (score ${dayNakshatra.score}). Prefer another date from the scan.`,
      summarySi: suitable
        ? `${input.date} චන්ද්‍ර ${dayNakshatra.spoken} — ${event.si} සඳහා ${grade} (ලකුණු ${dayNakshatra.score}). රාහු ${muh.rahuKalaya.start}–${muh.rahuKalaya.end} වළකින්න.`
        : `${input.date} චන්ද්‍ර ${dayNakshatra.spoken} — ${event.si} සඳහා ${grade} (ලකුණු ${dayNakshatra.score}). වෙනත් දිනයක් සොයන්න.`,
    },
  };
}

export async function scanEventDates(input: {
  birth: BirthInput;
  eventId: EventCategoryId;
  fromDate: string;
  toDate: string;
  placeId?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  limit?: number;
}): Promise<{
  native: { janmaNekatha: string; janmaNekathaSi: string; janmaIndex: number };
  event: EventCategory;
  bringIn: NakathOption[];
  fromDate: string;
  toDate: string;
  scannedDays: number;
  dates: DateSuitability[];
}> {
  const span = daysBetween(input.fromDate, input.toDate);
  if (span < 0) throw new Error("toDate must be on or after fromDate");
  if (span > 90) throw new Error("Scan range max is 90 days");

  const chart = await castKendraya(input.birth);
  const janma = findNekatha(chart.chandra.nekatha);
  const event = eventById(input.eventId);
  const cat = catalogueForEvent(janma.index, input.eventId);

  const place = {
    placeId: input.placeId ?? input.birth.placeId,
    placeName: input.placeName ?? input.birth.placeName,
    latitude: input.latitude ?? input.birth.latitude,
    longitude: input.longitude ?? input.birth.longitude,
    timezone: input.timezone ?? input.birth.timezone,
  };

  const dates: DateSuitability[] = [];
  for (let i = 0; i <= span; i++) {
    const date = addDays(input.fromDate, i);
    try {
      const [pan, muh] = await Promise.all([
        getPanchanga({ date, ...place }),
        computeMuhurta({ date, ...place }),
      ]);
      const dayName = dayNakshatraName(pan);
      const dayNakshatra = scoreNakathForEvent(dayName, janma.index, event);
      const grade = gradeFromScore(dayNakshatra.score);
      const suitable = grade === "excellent" || grade === "good";
      dates.push({
        date,
        weekdayEn: muh.weekdayEn,
        weekdaySi: muh.weekdaySi,
        dayNakshatra,
        suitable,
        grade,
        rahuKalaya: {
          start: muh.rahuKalaya.start,
          end: muh.rahuKalaya.end,
        },
        summaryEn: `${date}: ${dayNakshatra.english} · ${grade} (${dayNakshatra.score})`,
        summarySi: `${date}: ${dayNakshatra.spoken} · ${grade} (${dayNakshatra.score})`,
      });
    } catch {
      /* skip bad day */
    }
  }

  dates.sort(
    (a, b) =>
      Number(b.suitable) - Number(a.suitable) ||
      b.dayNakshatra.score - a.dayNakshatra.score ||
      a.date.localeCompare(b.date),
  );

  const limit = Math.min(Math.max(input.limit ?? 20, 1), 60);
  return {
    native: {
      janmaNekatha: janma.english,
      janmaNekathaSi: janma.spoken,
      janmaIndex: janma.index,
    },
    event,
    bringIn: cat.bringIn,
    fromDate: input.fromDate,
    toDate: input.toDate,
    scannedDays: span + 1,
    dates: dates.slice(0, limit),
  };
}
