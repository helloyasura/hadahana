import { z } from "zod";
import { birthSchema } from "../astrology/birth-schema";
export const studioBirthSchema = birthSchema.extend({
  latitude: z.number().min(-89).max(89),
  longitude: z.number().min(-180).max(180),
  timezone: z
    .string()
    .min(1)
    .max(80)
    .refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => {
      const d = new Date(`${v}T12:00:00Z`);
      return (
        Number.isFinite(+d) &&
        d.toISOString().slice(0, 10) === v &&
        +v.slice(0, 4) >= 1800 &&
        +v.slice(0, 4) <= 2200
      );
    }),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
export const civilDateSchema = studioBirthSchema.shape.date;
