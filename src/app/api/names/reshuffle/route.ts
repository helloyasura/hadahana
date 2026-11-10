import { requireFeature } from "@/lib/account/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { reshuffleSchema as schema } from "@/lib/names/reshuffle-schema";
import {
  buildLearningSnapshot,
  recordFeedback,
} from "@/lib/names/feedback-store";
import { reshuffleNamePart } from "@/lib/names/reshuffle";
import type { SuggestedName } from "@/lib/names/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await requireFeature(req);
  if (denied) return denied;
  try {
    if (Number(req.headers.get("content-length") || 0) > 768000)
      return NextResponse.json(
        { ok: false, error: "Name request is too large." },
        { status: 413 },
      );
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 768000)
      return NextResponse.json(
        { ok: false, error: "Name request is too large." },
        { status: 413 },
      );
    const body = schema.parse(JSON.parse(raw));
    const current = body.current as SuggestedName;
    const pool = body.pool as SuggestedName[];

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
      religionContext: body.religionContext,
      includeTraditional: body.includeTraditional,
      includeReview: body.includeReview,
      excludePairs: body.excludePairs,
      excludeParts: body.excludeParts,
    });

    if (!next) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No unused compatible replacement remains. Regenerate names or change letters/preferences; older suggestions may need regenerating.",
          learning,
        },
        { status: 409 },
      );
    }

    let feedbackSaved = true;
    if (body.recordDownvote) {
      try {
        await recordFeedback({
          action: "down",
          target: body.part,
          firstRoman: current.first.roman,
          firstSinhala: current.first.sinhala,
          middleRoman: current.middle.roman,
          middleSinhala: current.middle.sinhala,
          sessionId: body.sessionId,
        });
      } catch {
        // A storage outage is not an invalid client request. The replacement is
        // safe and session exclusions still prevent repeats; do not expose paths.
        feedbackSaved = false;
        console.warn("name_feedback_write_unavailable");
      }
    }
    return NextResponse.json(
      {
        ok: true,
        name: next,
        learning,
        feedbackSaved,
        warning: feedbackSaved
          ? undefined
          : "Name replaced, but feedback could not be saved. Please try feedback again later.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? `Invalid name request: ${err.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}`
        : err instanceof SyntaxError
          ? "Invalid JSON name request."
          : "Unable to replace this name. Please regenerate and try again.";
    return NextResponse.json(
      { ok: false, error: message },
      {
        status:
          err instanceof z.ZodError || err instanceof SyntaxError ? 400 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
