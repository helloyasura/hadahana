import { z } from "zod";
import {
  calculationConfigSchema,
  DEFAULT_CALCULATION_CONFIG,
} from "../astrology/config";

export const BODIES = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
  "Lagna",
] as const;
/** Additive defaults let pre-studio profiles and immutable presets load unchanged. */
export const studioSettingsSchema = z
  .object({
    version: z.literal(1).default(1),
    calculation: calculationConfigSchema.default({
      ...DEFAULT_CALCULATION_CONFIG,
    }),
    layout: z.enum(["wheel", "square"]).default("wheel"),
    division: z.union([z.literal(1), z.literal(9)]).default(1),
    houses: z.enum(["whole-sign", "equal"]).default("whole-sign"),
    aspects: z.enum(["none", "parashari", "degree"]).default("parashari"),
    orb: z.number().min(0).max(15).default(6),
    bodies: z
      .array(z.enum(BODIES))
      .max(10)
      .refine((v) => new Set(v).size === v.length)
      .default([...BODIES]),
    nakshatras: z.boolean().default(true),
    notes: z.string().max(6000).default(""),
  })
  .strict();
export type StudioSettings = z.infer<typeof studioSettingsSchema>;
export const RASHIS = [
  "මේෂ",
  "වෘෂභ",
  "මිථුන",
  "කටක",
  "සිංහ",
  "කන්‍යා",
  "තුලා",
  "වෘශ්චික",
  "ධනු",
  "මකර",
  "කුම්භ",
  "මීන",
];
export const NAKSHATRAS = [
  "අස්විද",
  "බෙරණ",
  "කැති",
  "රෙහෙණ",
  "මුවසිරස",
  "අද",
  "පුනාවස",
  "පුෂ",
  "අස්ලිස",
  "මා",
  "පුවපල්",
  "උත්‍රපල්",
  "හත",
  "සිත",
  "සා",
  "විසා",
  "අනුර",
  "දෙට",
  "මුල",
  "පුවසල",
  "උත්‍රසල",
  "සුවණ",
  "දෙනට",
  "සියාවස",
  "පුවපුටුප",
  "උත්‍රපුටුප",
  "රේවතී",
];
export const normalizeLongitude = (n: number) => {
  const remainder = n % 360;
  return remainder < 0 ? remainder + 360 : remainder === 0 ? 0 : remainder;
};
/** Parashari D9: each successive 3°20′ of the zodiac maps to the next navamsa. */
export const divisionalLongitude = (n: number, division: 1 | 9) =>
  normalizeLongitude(n * division);
export function positionInfo(longitude: number) {
  const lon = normalizeLongitude(longitude);
  return {
    longitude: lon,
    sign: Math.floor(lon / 30),
    degree: lon % 30,
    nakshatra: Math.floor(lon / (360 / 27)),
    pada: (Math.floor(lon / (360 / 108)) % 4) + 1,
  };
}
export function studioHouse(
  longitude: number,
  asc: number,
  method: StudioSettings["houses"],
) {
  const start =
    method === "equal" ? asc : Math.floor(normalizeLongitude(asc) / 30) * 30;
  return Math.floor(normalizeLongitude(longitude - start) / 30) + 1;
}
export type StudioBody = {
  name: string;
  label: string;
  longitude: number;
  retrograde: boolean;
  dignity: string;
};
/** Directed sign-based graha drishti. Nodes/Lagna are deliberately excluded (school-dependent). */
export function aspectBetween(
  a: StudioBody,
  b: StudioBody,
  rule: StudioSettings["aspects"],
  orb: number,
) {
  if (
    rule === "none" ||
    ["Rahu", "Ketu", "Lagna"].includes(a.name) ||
    ["Rahu", "Ketu", "Lagna"].includes(b.name)
  )
    return false;
  if (rule === "parashari") {
    const distance =
      ((Math.floor(b.longitude / 30) - Math.floor(a.longitude / 30) + 12) %
        12) +
      1;
    const targets =
      a.name === "Mars"
        ? [4, 7, 8]
        : a.name === "Jupiter"
          ? [5, 7, 9]
          : a.name === "Saturn"
            ? [3, 7, 10]
            : [7];
    return targets.includes(distance);
  }
  const separation = Math.abs(
    normalizeLongitude(b.longitude - a.longitude + 180) - 180,
  );
  return [0, 60, 90, 120, 180].some(
    (angle) => Math.abs(separation - angle) <= orb,
  );
}
