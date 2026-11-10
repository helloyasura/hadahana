import { z } from "zod";

/** Only independently wired engine capabilities are accepted. Never silently fallback. */
export const calculationConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    ayanamsa: z.enum(["lahiri", "raman", "kp_new"]),
    sunriseDisc: z.enum(["upper-limb", "centre"]),
    sunriseRefraction: z.boolean(),
    nodes: z.enum(["mean", "true"]),
    dasaYearDays: z.union([z.literal(365.25), z.literal(360)]),
    balanceDisplay: z.enum(["years-months-days", "decimal-years"]),
    houseSystem: z.literal("whole-sign"),
    nameLetterTable: z.literal("sinhala-v1"),
  })
  .strict();
export type CalculationConfig = z.infer<typeof calculationConfigSchema>;
export const DEFAULT_CALCULATION_CONFIG: Readonly<CalculationConfig> =
  Object.freeze({
    schemaVersion: 1,
    ayanamsa: "lahiri",
    sunriseDisc: "upper-limb",
    sunriseRefraction: true,
    nodes: "mean",
    dasaYearDays: 365.25,
    balanceDisplay: "years-months-days",
    houseSystem: "whole-sign",
    nameLetterTable: "sinhala-v1",
  });
export const AYANAMSA_LABELS = {
  lahiri: "Lahiri (Chitrapaksha)",
  raman: "Raman",
  kp_new: "KP New (not KP Old)",
};
