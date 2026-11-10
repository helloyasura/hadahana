import { requireFeature } from "@/lib/account/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildLearningSnapshot,
  loadFeedbackStore,
  netScore,
  recordFeedback,
} from "@/lib/names/feedback-store";

export const runtime = "nodejs";

const postSchema = z.object({
  action: z.enum(["up", "down"]),
  target: z.enum(["full", "first", "middle"]),
  firstRoman: z.string().min(1).max(80),
  firstSinhala: z.string().max(80).optional().default(""),
  middleRoman: z.string().min(1).max(80),
  middleSinhala: z.string().max(80).optional().default(""),
  sessionId: z.string().max(80).optional(),
});

export async function GET(req: Request) {
  const denied = await requireFeature(req);
  if (denied) return denied;
  try {
    const store = await loadFeedbackStore();
    const learning = await buildLearningSnapshot(store);
    const parts = Object.values(store.parts)
      .map((p) => ({
        ...p,
        net: netScore(p),
      }))
      .sort((a, b) => b.net - a.net || b.upCount - a.upCount);
    return NextResponse.json(
      {
        ok: true,
        learning,
        parts,
        eventCount: store.events.length,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Feedback is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  const denied = await requireFeature(req);
  if (denied) return denied;
  try {
    const body = postSchema.parse(await req.json());
    const { store, touched } = await recordFeedback(body);
    const learning = await buildLearningSnapshot(store);
    return NextResponse.json(
      {
        ok: true,
        touched: touched.map((t) => ({ ...t, net: netScore(t) })),
        learning,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const invalid = err instanceof z.ZodError || err instanceof SyntaxError;
    return NextResponse.json(
      {
        ok: false,
        error: invalid
          ? "Invalid feedback request."
          : "Feedback could not be saved. Please try again later.",
      },
      { status: invalid ? 400 : 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
