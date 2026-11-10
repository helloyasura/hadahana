import { requireFeature } from "@/lib/account/server";
import { NextResponse } from "next/server";
import { namThebimaOnly } from "@/lib/astrology/kendraya";
import { birthSchema } from "@/lib/astrology/birth-schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await requireFeature(req); if (denied) return denied;
  try {
    const body = birthSchema.parse(await req.json());
    const result = await namThebimaOnly(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
