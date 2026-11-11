import { RASHIS, studioHouse } from "./studio";
import { signDignity } from "./references";
export const YOGA_DEFINITIONS = [
  {
    name: "Ruchaka / රුචක",
    planet: "Mars",
    rule: "Mars own/exalted sign + kendra from Lagna",
  },
  {
    name: "Bhadra / භද්‍ර",
    planet: "Mercury",
    rule: "Mercury own/exalted sign + kendra from Lagna",
  },
  {
    name: "Hamsa / හංස",
    planet: "Jupiter",
    rule: "Jupiter own/exalted sign + kendra from Lagna",
  },
  {
    name: "Malavya / මාලව්‍ය",
    planet: "Venus",
    rule: "Venus own/exalted sign + kendra from Lagna",
  },
  {
    name: "Shasha / ශශ",
    planet: "Saturn",
    rule: "Saturn own/exalted sign + kendra from Lagna",
  },
  {
    name: "Gajakesari geometry / ගජකේසරී මූලික හැඩය",
    planet: "Jupiter",
    rule: "Jupiter in 1/4/7/10 sign from Moon (basic candidate only)",
  },
] as const;
type ChartFactors = {
  navagraha: {
    graha: string;
    longitude: number;
    longitudeExact?: number;
    combust?: boolean;
  }[];
  lagna: { longitude: number; longitudeExact?: number };
};
export function yogaCandidates(chart: ChartFactors) {
  const byName = new Map(chart.navagraha.map((p) => [p.graha, p]));
  const asc = chart.lagna.longitudeExact ?? chart.lagna.longitude;
  return YOGA_DEFINITIONS.map((definition, index) => {
    const p = byName.get(definition.planet),
      moon = byName.get("Moon");
    if (!p)
      return {
        ...definition,
        matched: false,
        detail: "Planet data missing",
        cautions: "Not evaluated",
      };
    const lon = p.longitudeExact ?? p.longitude,
      sign = Math.floor(lon / 30),
      house = studioHouse(lon, asc, "whole-sign"),
      d = signDignity(definition.planet, lon);
    const fromMoon = moon
      ? studioHouse(lon, moon.longitudeExact ?? moon.longitude, "whole-sign")
      : 0;
    return {
      ...definition,
      matched:
        index < 5
          ? [1, 4, 7, 10].includes(house) && (d.own || d.exalted)
          : [1, 4, 7, 10].includes(fromMoon),
      detail: `${RASHIS[sign]} · H${house}${index === 5 ? ` · ${fromMoon} from Moon` : ""}`,
      cautions: [
        p.combust ? "Combust (engine flag)" : "",
        d.debilitated ? "Debilitated" : "",
        "Strength, benefic support, cancellations, Moon condition and full classical qualifications are not evaluated.",
      ]
        .filter(Boolean)
        .join(" · "),
    };
  });
}
