import { requireFeature } from "@/lib/account/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { birthSchema } from "@/lib/astrology/birth-schema";
import { suggestModernNames } from "@/lib/names/generate-names";
import {
  NAME_COUNT_DEFAULT,
  NAME_COUNT_MAX,
  NAME_COUNT_MIN,
} from "@/lib/names/name-count";

export const runtime = "nodejs";
export const maxDuration = 300;

const schema = z
  .object({
    birth: birthSchema.optional(),
    motherName: z.string().max(80).optional(),
    fatherName: z.string().max(80).optional(),
    siblingNames: z.array(z.string().max(80)).max(8).optional(),
    interestsMother: z.array(z.string()).max(10).optional(),
    interestsFather: z.array(z.string()).max(10).optional(),
    sharedHopes: z.string().max(400).optional(),
    livingCountry: z
      .enum(["lk", "au", "uk", "us", "ca", "ae", "sg", "in", "other"])
      .optional(),
    personality: z
      .enum([
        "ensemble",
        "athurudaya",
        "diaspora",
        "multicultural",
        "meaning_weaver",
        "family_harmony",
        "sinhala_language",
        "sinhala_literature",
        "multi_religion",
      ])
      .optional(),
    preferPrimaryLetter: z.boolean().optional(),
    count: z
      .number()
      .int()
      .min(NAME_COUNT_MIN)
      .max(NAME_COUNT_MAX)
      .optional(),
    letterSource: z.enum(["chart", "manual"]).optional(),
    manualFirstLetters: z.array(z.string().max(12)).max(16).optional(),
    manualMiddleLetters: z.array(z.string().max(12)).max(16).optional(),
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
      .optional(),
    nameLanguage: z.enum(["si", "en", "bilingual"]).optional(),
    verifyCurrentUsage: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const source = val.letterSource ?? "chart";
    if (source === "chart" && !val.birth) {
      ctx.addIssue({
        code: "custom",
        message: "birth is required when letterSource is chart",
        path: ["birth"],
      });
    }
    if (source === "manual") {
      const first = (val.manualFirstLetters ?? []).filter((x) => x.trim());
      if (!first.length) {
        ctx.addIssue({
          code: "custom",
          message: "manualFirstLetters required for manual letter mode",
          path: ["manualFirstLetters"],
        });
      }
    }
  });

export async function POST(req: Request) {
  const denied = await requireFeature(req); if (denied) return denied;
  try {
    const body = schema.parse(await req.json());
    const result = await suggestModernNames({
      birth: body.birth,
      motherName: body.motherName,
      fatherName: body.fatherName,
      siblingNames: body.siblingNames,
      interestsMother: body.interestsMother as never,
      interestsFather: body.interestsFather as never,
      sharedHopes: body.sharedHopes,
      livingCountry: body.livingCountry,
      personality: body.personality,
      preferPrimaryLetter: body.preferPrimaryLetter,
      count: body.count ?? NAME_COUNT_DEFAULT,
      letterSource: body.letterSource ?? "chart",
      manualFirstLetters: body.manualFirstLetters,
      manualMiddleLetters: body.manualMiddleLetters,
      religionContext: body.religionContext,
      nameLanguage: body.nameLanguage,
      verifyCurrentUsage: body.verifyCurrentUsage,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
