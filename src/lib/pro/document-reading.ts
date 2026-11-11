import { z } from "zod";
import type { Client } from "./store";
import { positionInfo } from "./studio";
export const planetNames = [
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
const sign = z.number().int().min(0).max(11).nullable();
export const documentReadingSchema = z.object({
  lagna: sign,
  planets: z.record(z.enum(planetNames), sign),
  dashaLord: z.union([z.enum(planetNames), z.literal("")]),
  years: z.number().int().min(0).max(120),
  months: z.number().int().min(0).max(11),
  days: z.number().int().min(0).max(31),
  yearDays: z.enum(["360", "365.25"]),
  checkBalance: z.boolean(),
});
export type DocumentReading = z.infer<typeof documentReadingSchema>;
export const emptyReading: DocumentReading = {
  lagna: null,
  planets: {
    Sun: null,
    Moon: null,
    Mars: null,
    Mercury: null,
    Jupiter: null,
    Venus: null,
    Saturn: null,
    Rahu: null,
    Ketu: null,
  },
  dashaLord: "",
  years: 0,
  months: 0,
  days: 0,
  yearDays: "365.25",
  checkBalance: false,
};
export function compareDocument(
  result: Client["result"],
  stated: DocumentReading,
) {
  const rows: {
    point: string;
    stated: string | number;
    computed: string | number;
    matches: boolean;
  }[] = [];
  const asc = positionInfo(
    result.lagna.longitudeExact ?? result.lagna.longitude,
  ).sign;
  if (stated.lagna !== null)
    rows.push({
      point: "Lagna",
      stated: stated.lagna,
      computed: asc,
      matches: stated.lagna === asc,
    });
  for (const p of result.navagraha) {
    const sign = stated.planets[p.graha as keyof DocumentReading["planets"]];
    if (sign === null || sign === undefined) continue;
    const computed = positionInfo(p.longitudeExact ?? p.longitude).sign;
    rows.push({
      point: p.graha,
      stated: sign,
      computed,
      matches: sign === computed,
    });
  }
  if (stated.dashaLord)
    rows.push({
      point: "Dasha lord",
      stated: stated.dashaLord,
      computed: result.vimshottari.balanceAtBirth.lord,
      matches: stated.dashaLord === result.vimshottari.balanceAtBirth.lord,
    });
  if (stated.checkBalance) {
    const expected =
      result.vimshottari.balanceAtBirth.years *
      result.vimshottari.convention.yearDays;
    const actual =
      (stated.years + stated.months / 12) * Number(stated.yearDays) +
      stated.days;
    rows.push({
      point: "Dasha balance (days)",
      stated: actual.toFixed(2),
      computed: expected.toFixed(2),
      matches: Math.abs(expected - actual) <= 1.5,
    });
  }
  return rows;
}
