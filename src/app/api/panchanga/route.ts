import { requireFeature } from "@/lib/account/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPanchanga } from "@/lib/astrology/panchanga";

export const runtime = "nodejs";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  placeId: z.string().optional(),
  placeName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
});

export async function POST(req: Request) {
  const denied = await requireFeature(req); if (denied) return denied;
  try {
    const body = schema.parse(await req.json());
    const result = await getPanchanga(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
