import { z } from "zod";

export const birthSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/),
  placeId: z.string().max(120).optional(),
  placeName: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().max(80).optional(),
  ayanamsa: z.enum(["lahiri", "kp_new", "raman"]).optional(),
  gender: z.enum(["male", "female", "unspecified"]).optional(),
  nativeName: z.string().max(120).optional(),
});

export type BirthBody = z.infer<typeof birthSchema>;
