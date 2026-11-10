import { requireFeature } from "@/lib/account/server";
import { NextResponse } from "next/server";
import { listEventCategories } from "@/lib/astrology/event-categories";

export const runtime = "nodejs";

/** Catalogue of event categories users can bring into muhurta search. */
export async function GET(req: Request) {
  const denied = await requireFeature(req); if (denied) return denied;
  return NextResponse.json({
    ok: true,
    events: listEventCategories(),
  });
}
