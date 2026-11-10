import { requireFeature } from "@/lib/account/server";
import { NextResponse } from "next/server";
import { birthSchema } from "@/lib/astrology/birth-schema";
import { buildSatahana } from "@/lib/astrology/satahana";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await requireFeature(req); if (denied) return denied;
  try {
    const body = birthSchema.parse(await req.json());
    const satahana = await buildSatahana(body);
    return NextResponse.json({ ok: true, satahana });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
