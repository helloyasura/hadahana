import { requireFeature } from "@/lib/account/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { matchPorondam } from "@/lib/astrology/porondam";
import { birthSchema } from "@/lib/astrology/birth-schema";

export const runtime = "nodejs";

const bodySchema = z.object({
  personA: birthSchema,
  personB: birthSchema,
});

export async function POST(req: Request) {
  const denied = await requireFeature(req); if (denied) return denied;
  try {
    const body = bodySchema.parse(await req.json());
    const result = await matchPorondam(body.personA, body.personB);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
