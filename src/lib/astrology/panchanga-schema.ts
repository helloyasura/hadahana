import { z } from "zod";
import { resolvePlace } from "./places";

// Bound the ephemeris work and reject normalized/overflow dates such as February 30.
export const panchangaSchema = z.strictObject({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const time = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value && value >= "1900-01-01" && value <= "2100-12-31";
  }, "Choose a valid date between 1900 and 2100"),
  placeId: z.string().trim().min(1).max(100).optional(),
  placeName: z.string().trim().min(1).max(160).optional(),
  latitude: z.number().finite().min(-90).max(90).optional(),
  longitude: z.number().finite().min(-180).max(180).optional(),
  timezone: z.string().max(80).refine(value => {
    try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
  }, "Invalid timezone").optional(),
}).superRefine((input, ctx) => {
  if ((input.latitude == null) !== (input.longitude == null)) ctx.addIssue({ code: "custom", message: "Provide both latitude and longitude" });
  try { resolvePlace(input); } catch { ctx.addIssue({ code: "custom", message: "Choose a known place or provide coordinates" }); }
});
export type PanchangaInput = z.infer<typeof panchangaSchema>;
