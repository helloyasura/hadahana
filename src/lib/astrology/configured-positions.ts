import {
  en,
  EphemerisService,
  type ChartResponse,
  type PlanetPosition,
} from "vpv-panchangam";
import {
  formatDms,
  nakshatraPada,
} from "vpv-panchangam/dist/calculations/panchang";
import { applySpecialPlacements } from "vpv-panchangam/dist/calculations/placements";
import { computeKalsarpa } from "vpv-panchangam/dist/calculations/kalsarpa";
import type { CalculationConfig } from "./config";
import { civilWeekday } from "./birth-day";

/** Synchronous critical section: set full sidereal state immediately before use. */
export function applyConfiguredNodes(
  raw: ChartResponse,
  config: CalculationConfig,
) {
  if (config.nodes === "mean") return;
  const ephe = EphemerisService.getInstance();
  ephe.setAyanamsa(config.ayanamsa);
  const node = ephe.calcUt(raw.birth.julian_day, 11, 2 | 256 | 65536); // SE_TRUE_NODE
  const planets = raw.planets_data as PlanetPosition[];
  const ascSign = Math.floor(raw.ascendant.longitude / 30);
  for (const p of planets.filter(
    (p) => p.name === "Rahu" || p.name === "Ketu",
  )) {
    const lon =
      (((node.lon + (p.name === "Ketu" ? 180 : 0)) % 360) + 360) % 360;
    const sign = Math.floor(lon / 30),
      nak = Math.floor(lon / (360 / 27));
    Object.assign(p, {
      longitude: lon,
      sign_id: sign + 1,
      sign: en.signs[sign],
      sign_lord: en.signLords[sign],
      degree_in_sign: lon % 30,
      dms: formatDms(lon % 30),
      nakshatra: en.nakshatras[nak],
      nakshatra_pada: nakshatraPada(lon),
      nakshatra_lord: en.nakshatraLords[nak % 9],
      house: ((sign - ascSign + 12) % 12) + 1,
      retrograde: node.speed < 0,
    });
  }
  applySpecialPlacements(
    planets,
    ascSign + 1,
    planets.find((p) => p.name === "Sun")!.longitude,
  );
  raw.kalsarpa = computeKalsarpa(
    Object.fromEntries(planets.map((p) => [p.name, p.longitude])),
    planets.find((p) => p.name === "Rahu")!.house,
    planets.find((p) => p.name === "Ketu")!.house,
  );
}

/** The binding exposes an altitude threshold, NOT Swiss Hindu-rising bit flags.
 * Fixed standard-horizon approximation: semidiameter 16', refraction 34'.
 * No elevation/terrain/weather adjustment. Default -0.833333 matches the binding.
 */
export function configuredBirthSunrise(
  birthIso: string,
  latitude: number,
  longitude: number,
  timezone: string,
  config: CalculationConfig,
) {
  const ephe = EphemerisService.getInstance();
  const birthJd = Date.parse(birthIso) / 86400000 + 2440587.5;
  const altitude =
    -(config.sunriseDisc === "upper-limb" ? 16 / 60 : 0) -
    (config.sunriseRefraction ? 34 / 60 : 0);
  const effectiveAltitude =
    config.sunriseDisc === "upper-limb" && config.sunriseRefraction
      ? -0.8333
      : altitude;
  const rise = ephe.riseTrans(
    birthJd - 1.1,
    0,
    [longitude, latitude, 0],
    1,
    effectiveAltitude,
  );
  if (!rise) throw new Error("Sunrise is unavailable at this location");
  const next = ephe.riseTrans(
    rise + 0.01,
    0,
    [longitude, latitude, 0],
    1,
    effectiveAltitude,
  );
  const preceding = next && next <= birthJd ? next : rise;
  const iso = new Date((preceding - 2440587.5) * 86400000).toISOString();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return { sunrise: iso, weekday: civilWeekday(date), vedicDate: date };
}
