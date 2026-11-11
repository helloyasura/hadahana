import { RASHI, BHAVA, grahaLabel } from "../astrology/sinhala-names";
import { NEKATHA_TABLE } from "../astrology/nakath-akshara";
import { GANA, YONI } from "../astrology/nakshatra-attributes";
import { RASHIS, positionInfo } from "./studio";
export const CLASSICAL_PLANETS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
] as const;
export type ClassicalPlanet = (typeof CLASSICAL_PLANETS)[number];
/** BPHS 3.49–55, common seven-planet convention. No disputed node dignities. */
export const PLANET_REFERENCE: Record<
  ClassicalPlanet,
  {
    own: number[];
    exalted: number;
    exaltDegree: number;
    friends: ClassicalPlanet[];
    enemies: ClassicalPlanet[];
    karaka: string;
  }
> = {
  Sun: {
    own: [4],
    exalted: 0,
    exaltDegree: 10,
    friends: ["Moon", "Mars", "Jupiter"],
    enemies: ["Venus", "Saturn"],
    karaka: "ආත්ම / Soul, authority",
  },
  Moon: {
    own: [3],
    exalted: 1,
    exaltDegree: 3,
    friends: ["Sun", "Mercury"],
    enemies: [],
    karaka: "මනස / Mind",
  },
  Mars: {
    own: [0, 7],
    exalted: 9,
    exaltDegree: 28,
    friends: ["Sun", "Moon", "Jupiter"],
    enemies: ["Mercury"],
    karaka: "ශක්තිය / Courage, strength",
  },
  Mercury: {
    own: [2, 5],
    exalted: 5,
    exaltDegree: 15,
    friends: ["Sun", "Venus"],
    enemies: ["Moon"],
    karaka: "වාණී / Speech, communication",
  },
  Jupiter: {
    own: [8, 11],
    exalted: 3,
    exaltDegree: 5,
    friends: ["Sun", "Moon", "Mars"],
    enemies: ["Mercury", "Venus"],
    karaka: "ඥාන / Knowledge, guidance",
  },
  Venus: {
    own: [1, 6],
    exalted: 11,
    exaltDegree: 27,
    friends: ["Mercury", "Saturn"],
    enemies: ["Sun", "Moon"],
    karaka: "වීර්ය / Vigour; කලා / arts",
  },
  Saturn: {
    own: [9, 10],
    exalted: 6,
    exaltDegree: 20,
    friends: ["Mercury", "Venus"],
    enemies: ["Sun", "Moon", "Mars"],
    karaka: "දුක් / Hardship; endurance",
  },
};
export function signDignity(planet: string, longitude: number) {
  const row = PLANET_REFERENCE[planet as ClassicalPlanet],
    sign = positionInfo(longitude).sign;
  return {
    exalted: !!row && row.exalted === sign,
    debilitated: !!row && (row.exalted + 6) % 12 === sign,
    own: !!row && row.own.includes(sign),
  };
}
export function naturalFriendship(from: ClassicalPlanet, to: ClassicalPlanet) {
  if (from === to) return "self";
  const p = PLANET_REFERENCE[from];
  return p.friends.includes(to)
    ? "friend"
    : p.enemies.includes(to)
      ? "enemy"
      : "neutral";
}
export type ReferenceEntry = {
  id: string;
  title: string;
  category: string;
  text: string;
  select: string;
};
export function referenceEntries(): ReferenceEntry[] {
  return [
    ...CLASSICAL_PLANETS.map((name) => {
      const p = PLANET_REFERENCE[name];
      return {
        id: `ref-${name}`,
        title: `${grahaLabel(name).sinhala} · ${name}`,
        category: "බල තත්ත්ව / Dignity · Friendship · Karaka",
        text: `Own: ${p.own.map((i) => RASHIS[i]).join(" / ")} · Exalted: ${RASHIS[p.exalted]} ${p.exaltDegree}° · Debilitated: ${RASHIS[(p.exalted + 6) % 12]} ${p.exaltDegree}° · Friends: ${p.friends.join(", ") || "—"} · Enemies: ${p.enemies.join(", ") || "—"} · Karaka: ${p.karaka}. Natural friendship is directed, not temporary/fivefold.`,
        select: name,
      };
    }),
    ...NEKATHA_TABLE.map((n) => ({
      id: `ref-nak-${n.index}`,
      title: `${n.spoken} · ${n.english}`,
      category: "නැකත් / Nakshatra · Gana · Yoni",
      text: `Lord ${n.lord} · Gana ${GANA[n.index]} · Yoni ${YONI[n.index]} · Pada: ${n.padas.map((p, i) => `${i + 1} ${p.sinhala} (${p.roman})`).join(" / ")}. Inherited preliminary SL matching table; verify school convention.`,
      select: "",
    })),
    ...Object.entries(RASHI).map(([name, p]) => ({
      id: `ref-rashi-${name}`,
      title: `${p.sinhala} · ${name}`,
      category: "රාශි / Rashi",
      text: `Lord ${p.lord} · Element ${p.element}`,
      select: "",
    })),
    ...Object.entries(BHAVA).map(([n, p]) => ({
      id: `ref-bhava-${n}`,
      title: `${n} · ${p.sinhala}`,
      category: "භාව / House",
      text: `${p.sanskrit} · ${p.themes}`,
      select: "",
    })),
  ];
}
