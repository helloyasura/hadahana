/**
 * Daily muhurta helpers used by Sri Lankan athurudayas.
 * Prefer Swiss-ephemeris Rahu/Yamaganda/Gulika from panchanga when available;
 * otherwise fall back to the common SL weekday daytime 1/8 table.
 */

import { getPanchanga } from "./panchanga";

export type MuhurtaInput = {
  date: string; // YYYY-MM-DD
  placeId?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  /** Optional sunrise/sunset override (decimal hours local) */
  sunriseHour?: number;
  sunsetHour?: number;
};

/** Weekday → which daytime eighth is Rahu (1–8). Common SL table. */
const RAHU_EIGHTH: Record<number, number> = {
  0: 8,
  1: 2,
  2: 7,
  3: 5,
  4: 6,
  5: 4,
  6: 3,
};

const YAMAGANDA_EIGHTH: Record<number, number> = {
  0: 5,
  1: 4,
  2: 3,
  3: 2,
  4: 1,
  5: 7,
  6: 6,
};

const GULIKA_EIGHTH: Record<number, number> = {
  0: 7,
  1: 6,
  2: 5,
  3: 4,
  4: 3,
  5: 2,
  6: 1,
};

function weekdayColombo(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d, 6, 30);
  return new Date(utc).getUTCDay();
}

function formatHm(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const mm = ((m % 60) + 60) % 60;
  const hh = m >= 60 ? h + 1 : h;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function eighthWindow(
  sunrise: number,
  sunset: number,
  eighth: number,
): { start: string; end: string; eighth: number } {
  const dayLen = sunset - sunrise;
  const slice = dayLen / 8;
  const start = sunrise + (eighth - 1) * slice;
  const end = start + slice;
  return { start: formatHm(start), end: formatHm(end), eighth };
}

export async function computeMuhurta(input: MuhurtaInput) {
  const wd = weekdayColombo(input.date);
  const dayNamesEn = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayNamesSi = [
    "ඉරිදා",
    "සඳුදා",
    "අඟහරුවාදා",
    "බදාදා",
    "බ්‍රහස්පතින්දා",
    "සිකුරාදා",
    "සෙනසුරාදා",
  ];

  let ephemeris: Awaited<ReturnType<typeof getPanchanga>> | null = null;
  try {
    ephemeris = await getPanchanga(input);
  } catch {
    ephemeris = null;
  }

  const sunrise = input.sunriseHour ?? 6.0;
  const sunset = input.sunsetHour ?? 18.0;

  const tableRahu = eighthWindow(sunrise, sunset, RAHU_EIGHTH[wd]);
  const tableYamaganda = eighthWindow(sunrise, sunset, YAMAGANDA_EIGHTH[wd]);
  const tableGulika = eighthWindow(sunrise, sunset, GULIKA_EIGHTH[wd]);

  const rahu = ephemeris?.inauspiciousLocal?.rahuKalaya
    ? {
        start: ephemeris.inauspiciousLocal.rahuKalaya.start!,
        end: ephemeris.inauspiciousLocal.rahuKalaya.end!,
        eighth: RAHU_EIGHTH[wd],
        source: "ephemeris" as const,
      }
    : { ...tableRahu, source: "weekday_table" as const };

  const yamaganda = ephemeris?.inauspiciousLocal?.yamaganda
    ? {
        start: ephemeris.inauspiciousLocal.yamaganda.start!,
        end: ephemeris.inauspiciousLocal.yamaganda.end!,
        eighth: YAMAGANDA_EIGHTH[wd],
        source: "ephemeris" as const,
      }
    : { ...tableYamaganda, source: "weekday_table" as const };

  const gulika = ephemeris?.inauspiciousLocal?.gulika
    ? {
        start: ephemeris.inauspiciousLocal.gulika.start!,
        end: ephemeris.inauspiciousLocal.gulika.end!,
        eighth: GULIKA_EIGHTH[wd],
        source: "ephemeris" as const,
      }
    : { ...tableGulika, source: "weekday_table" as const };

  const midLocal = ephemeris?.sunriseSunset?.madhyahnaLocal;
  const abhijit = midLocal
    ? { start: midLocal, end: midLocal, note: "madhyahna ± ~24 min classically" }
    : {
        start: formatHm((sunrise + sunset) / 2 - 0.4),
        end: formatHm((sunrise + sunset) / 2 + 0.4),
        note: "approx midday window",
      };

  return {
    date: input.date,
    place: ephemeris?.place ?? null,
    weekdayEn: dayNamesEn[wd],
    weekdaySi: dayNamesSi[wd],
    sunrise:
      ephemeris?.sunriseSunset?.sunriseLocal ?? formatHm(sunrise),
    sunset: ephemeris?.sunriseSunset?.sunsetLocal ?? formatHm(sunset),
    rahuKalaya: {
      ...rahu,
      nameEn: "Rahu Kalaya",
      nameSi: "රාහු කාලය",
      guidanceEn: "Avoid Nam Thebima, weddings, business starts in this window.",
      guidanceSi: "නම් තැබීම, මංගල, ව්‍යාපාර ආරම්භ මෙම වේලාවේ නොකරන්න.",
    },
    yamaganda: {
      ...yamaganda,
      nameEn: "Yamaganda",
      nameSi: "යමගණ්ඩ",
    },
    gulika: {
      ...gulika,
      nameEn: "Gulika",
      nameSi: "ගුලික",
    },
    abhijit,
    panchangSummary: ephemeris?.panchang ?? null,
    namingAdviceEn:
      "Prefer Subha Nekatha outside Rahu/Yamaganda/Gulika. Abhijit is often usable if other limbs are clean.",
    namingAdviceSi:
      "රාහු/යමගණ්ඩ/ගුලිකෙන් බැහැර සුභ නැකතක නම් තබන්න. අනෙක් අංග හොඳ නම් අභිජිත් ද භාවිතා කළ හැක.",
  };
}
