import { NextResponse } from "next/server";
import { z } from "zod";
import { runAthurudayaAgent } from "@/lib/agent/athurudaya";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
  birth: z
    .object({
      date: z.string(),
      time: z.string(),
      placeId: z.string().optional(),
      placeName: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      gender: z.string().optional(),
      nativeName: z.string().optional(),
    })
    .nullable()
    .optional(),
  topic: z
    .enum([
      "naming",
      "studies",
      "career",
      "marriage",
      "muhurta",
      "general_palapala",
      "health_screen",
    ])
    .nullable()
    .optional(),
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "OPENAI_API_KEY missing. Add to .env.local (do not commit). Rotate any key pasted in chat.",
        },
        { status: 503 },
      );
    }
    const body = bodySchema.parse(await req.json());
    const result = await runAthurudayaAgent({
      messages: body.messages,
      birth: body.birth ?? null,
      topic: body.topic ?? null,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
