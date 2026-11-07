import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildLearningSnapshot,
  recordFeedback,
} from "@/lib/names/feedback-store";
import { reshuffleNamePart } from "@/lib/names/reshuffle";
import type { SuggestedName } from "@/lib/names/types";

export const runtime = "nodejs";

const namePartSchema = z.object({
  sinhala: z.string(),
  roman: z.string(),
  startsWith: z.string(),
  isPrimaryLetter: z.boolean(),
});

const suggestedSchema = z.object({
  sinhala: z.string(),
  roman: z.string(),
  first: namePartSchema,
  middle: namePartSchema,
  startsWith: z.string(),
  isPrimaryLetter: z.boolean(),
  meaningSi: z.string(),
  meaningEn: z.string(),
  whySi: z.string(),
  whyEn: z.string(),
  familyFitSi: z.string(),
  familyFitEn: z.string(),
  countryFitSi: z.string(),
  countryFitEn: z.string(),
  agentId: z.string(),
  agentLabelSi: z.string(),
  agentLabelEn: z.string(),
  score: z.number(),
  letterSource: z.enum(["chart", "manual"]),
  usageVerified: z.boolean().optional(),
  usageNoteSi: z.string().optional(),
  usageNoteEn: z.string().optional(),
  factors: z.record(z.string(), z.number()).optional(),
  alignWhySi: z.string().optional(),
  alignWhyEn: z.string().optional(),
});

const schema = z.object({
  part: z.enum(["first", "middle"]),
  current: suggestedSchema,
  pool: z.array(suggestedSchema).max(80).optional().default([]),
  firstLetters: z.array(z.string()).min(1).max(32),
  middleLetters: z.array(z.string()).max(32).optional().default([]),
  primary: z.string().min(1),
  gender: z.enum(["male", "female", "unspecified"]).optional().default("unspecified"),
  country: z
    .enum(["lk", "au", "uk", "us", "ca", "ae", "sg", "in", "other"])
    .optional()
    .default("lk"),
  letterSource: z.enum(["chart", "manual"]).optional().default("chart"),
  sessionId: z.string().max(80).optional(),
  /** Record a downrate for the replaced part (default true). */
  recordDownvote: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const current = body.current as SuggestedName;
    const pool = body.pool as SuggestedName[];

    if (body.recordDownvote) {
      await recordFeedback({
        action: "down",
        target: body.part,
        firstRoman: current.first.roman,
        firstSinhala: current.first.sinhala,
        middleRoman: current.middle.roman,
        middleSinhala: current.middle.sinhala,
        sessionId: body.sessionId,
      });
    }

    const learning = await buildLearningSnapshot();
    const next = reshuffleNamePart({
      current,
      part: body.part,
      pool,
      firstLetters: body.firstLetters,
      middleLetters: body.middleLetters.length
        ? body.middleLetters
        : body.firstLetters,
      primary: body.primary,
      gender: body.gender,
      country: body.country,
      letterSource: body.letterSource,
      learning,
      agentId: current.agentId,
    });

    if (!next) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No alternative name part found — try generating more names first.",
          learning,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, name: next, learning });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
