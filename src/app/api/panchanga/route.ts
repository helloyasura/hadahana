import { requireFeature } from "@/lib/account/server";
import { NextResponse } from "next/server";
import { panchangaSchema } from "@/lib/astrology/panchanga-schema";
import { getPanchanga } from "@/lib/astrology/panchanga";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await requireFeature(req); if (denied) return denied;
  try {
    const body = panchangaSchema.parse(await req.json());
    const result = await getPanchanga(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
