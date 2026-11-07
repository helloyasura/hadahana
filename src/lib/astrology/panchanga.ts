import { computeDetailedPanchang } from "vpv-panchangam";
import { resolvePlace } from "./places";

function localHm(iso: string | null | undefined, timeZone: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export async function getPanchanga(input: {
  date: string;
  placeId?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}) {
  const place = resolvePlace(input);
  const raw = await computeDetailedPanchang(
    input.date,
    place.latitude,
    place.longitude,
    place.timezone,
    "en",
  );

  const sunMoon = raw.sun_moon as {
    sunrise?: string;
    sunset?: string;
    moonrise?: string;
    moonset?: string;
    madhyahna?: string;
  };

  const inauspicious = raw.inauspicious_timings as {
    rahu_kalam?: { start: string; end: string };
    yamaganda?: { start: string; end: string };
    gulika_kalam?: { start: string; end: string };
  };

  const tz = place.timezone;

  return {
    place: place.label,
    date: input.date,
    timezone: tz,
    vara: raw.vara,
    panchang: raw.panchang,
    rashiNakshatra: raw.rashi_nakshatra,
    lunarMonth: raw.lunar_month,
    rituAyana: raw.ritu_ayana,
    sunriseSunset: {
      sunriseUtc: sunMoon?.sunrise ?? null,
      sunsetUtc: sunMoon?.sunset ?? null,
      sunriseLocal: localHm(sunMoon?.sunrise, tz),
      sunsetLocal: localHm(sunMoon?.sunset, tz),
      moonriseLocal: localHm(sunMoon?.moonrise, tz),
      moonsetLocal: localHm(sunMoon?.moonset, tz),
      madhyahnaLocal: localHm(sunMoon?.madhyahna, tz),
    },
    inauspiciousLocal: {
      rahuKalaya: inauspicious?.rahu_kalam
        ? {
            start: localHm(inauspicious.rahu_kalam.start, tz),
            end: localHm(inauspicious.rahu_kalam.end, tz),
          }
        : null,
      yamaganda: inauspicious?.yamaganda
        ? {
            start: localHm(inauspicious.yamaganda.start, tz),
            end: localHm(inauspicious.yamaganda.end, tz),
          }
        : null,
      gulika: inauspicious?.gulika_kalam
        ? {
            start: localHm(inauspicious.gulika_kalam.start, tz),
            end: localHm(inauspicious.gulika_kalam.end, tz),
          }
        : null,
    },
    chandrabalam: raw.chandrabalam,
    tarabalam: raw.tarabalam,
    noteEn:
      "Panchanga limbs guide muhurta. Pair with Rahu Kalaya before Nam Thebima or weddings.",
    noteSi:
      "පංචාංග අංග මුහුර්තයට යොදා ගනී. නම් තැබීමට පෙර රාහු කාලය ද පරීක්ෂා කරන්න.",
  };
}
