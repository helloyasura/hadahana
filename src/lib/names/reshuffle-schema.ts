import { z } from "zod";
import { NAME_COUNT_MAX } from "./name-count";
const part = z.object({
  sinhala: z.string().min(1).max(80),
  roman: z.string().min(1).max(80),
  startsWith: z.string().max(12),
  isPrimaryLetter: z.boolean().optional().default(false),
});
// Only the identity of the two parts is needed. Narrative/score/tag fields evolve
// independently and are rebuilt from the trusted catalogue, not trusted from clients.
const current = z.object({ first: part, middle: part }).passthrough();
export const reshuffleSchema = z.object({
  part: z.enum(["first", "middle"]),
  current,
  pool: z.array(current).max(NAME_COUNT_MAX).optional().default([]),
  firstLetters: z.array(z.string().max(12)).min(1).max(32),
  middleLetters: z.array(z.string().max(12)).max(32).optional().default([]),
  primary: z.string().min(1).max(12),
  gender: z
    .enum(["male", "female", "unspecified"])
    .optional()
    .default("unspecified"),
  country: z
    .enum(["lk", "au", "uk", "us", "ca", "ae", "sg", "in", "other"])
    .optional()
    .default("lk"),
  letterSource: z.enum(["chart", "manual"]).optional().default("chart"),
  religionContext: z
    .enum([
      "buddhist",
      "hindu",
      "christian",
      "islamic",
      "interfaith",
      "secular",
      "unspecified",
    ])
    .optional()
    .default("buddhist"),
  includeTraditional: z.boolean().optional().default(false),
  includeReview: z.boolean().optional().default(false),
  excludePairs: z.array(z.string().max(180)).max(2048).optional().default([]),
  excludeParts: z.array(z.string().max(80)).max(2048).optional().default([]),
  sessionId: z.string().max(80).optional(),
  recordDownvote: z.boolean().optional().default(true),
});
