import { EphemerisService } from "vpv-panchangam";
import type { CalculationConfig } from "../astrology/config";
import { grahaLabel } from "../astrology/sinhala-names";
import { normalizeLongitude, type StudioBody } from "./studio";
export const TRANSIT_BODIES = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
] as const;
export type TransitPlanet = (typeof TRANSIT_BODIES)[number];
const IDS: Record<TransitPlanet, number> = {
  Sun: 0,
  Moon: 1,
  Mercury: 2,
  Venus: 3,
  Mars: 4,
  Jupiter: 5,
  Saturn: 6,
  Rahu: 10,
  Ketu: 10,
};
export async function ephemerisSampler(
  config: CalculationConfig,
  planet: TransitPlanet,
) {
  const ephe = EphemerisService.getInstance();
  await ephe.init();
  return (ms: number) => {
    ephe.setAyanamsa(config.ayanamsa); // No await between state selection and calculation.
    const id =
      (planet === "Rahu" || planet === "Ketu") && config.nodes === "true"
        ? 11
        : IDS[planet];
    const p = ephe.calcUt(ms / 86400000 + 2440587.5, id, 2 | 256 | 65536);
    return {
      longitude: normalizeLongitude(p.lon + (planet === "Ketu" ? 180 : 0)),
      speed: p.speed,
    };
  };
}
export async function skyAt(
  ms: number,
  config: CalculationConfig,
): Promise<StudioBody[]> {
  if (!Number.isFinite(ms)) throw new Error("Invalid sky instant");
  const bodies: StudioBody[] = [];
  for (const name of TRANSIT_BODIES) {
    const sample = await ephemerisSampler(config, name),
      p = sample(ms);
    bodies.push({
      name,
      label: grahaLabel(name).sinhala,
      longitude: p.longitude,
      retrograde: p.speed < 0,
      dignity: "Gochara · geocentric",
    });
  }
  return bodies;
}
/** Hourly bracketing, then bisection to <=1 second. Returns first detected target entry,
 * forward or retrograde. No sign-skipping for normal planetary speeds at hourly sampling.
 * Very brief station-grazing excursions shorter than one hour are not guaranteed detected.
 */
export function findIngress(
  sample: (ms: number) => { longitude: number; speed: number },
  from: number,
  to: number,
  target: number,
) {
  if (
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    to <= from ||
    to - from > 366 * 86400000 ||
    !Number.isInteger(target) ||
    target < 0 ||
    target > 11
  )
    throw new Error("Invalid ingress range");
  let previous = from,
    before = sample(from),
    beforeSign = Math.floor(before.longitude / 30);
  for (
    let ms = Math.min(from + 3600000, to);
    ms <= to;
    ms = Math.min(ms + 3600000, to)
  ) {
    const after = sample(ms),
      sign = Math.floor(after.longitude / 30);
    if (sign !== beforeSign && sign === target) {
      let lo = previous,
        hi = ms;
      while (hi - lo > 1000) {
        const mid = (lo + hi) / 2;
        if (Math.floor(sample(mid).longitude / 30) === beforeSign) lo = mid;
        else hi = mid;
      }
      const p = sample(hi);
      return {
        instant: new Date(hi).toISOString(),
        longitude: p.longitude,
        retrograde: p.speed < 0,
        fromSign: beforeSign,
        toSign: target,
        toleranceSeconds: 1,
      };
    }
    if (ms === to) break;
    previous = ms;
    before = after;
    beforeSign = sign;
  }
  return null;
}
