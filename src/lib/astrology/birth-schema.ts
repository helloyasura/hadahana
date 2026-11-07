import { z } from "zod";

export const birthSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/),
  placeId: z.string().optional(),
  placeName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
  ayanamsa: z.enum(["lahiri", "kp_new", "raman"]).optional(),
  gender: z.enum(["male", "female", "unspecified"]).optional(),
  nativeName: z.string().optional(),
});

export type BirthBody = z.infer<typeof birthSchema>;
