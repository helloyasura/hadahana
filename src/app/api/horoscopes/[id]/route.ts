import { NextResponse } from "next/server";
import { currentProfile, requireFeature, accountFailure } from "@/lib/account/server";
import { birthSchema } from "@/lib/astrology/birth-schema";
import { fullChart } from "@/lib/account/chart";
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireFeature(req); if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const profile = await currentProfile();
    const saved = profile?.horoscopes.find(h => h.id === id);
    if (!saved) return NextResponse.json({ ok: false, error: "Horoscope not found" }, { status: 404 });
    const chart = { ...await fullChart(birthSchema.parse(saved.birth)), birth: saved.birth, horoscopeId: id };
    return NextResponse.json(chart, { headers: { "Cache-Control": "no-store", ...(new URL(req.url).searchParams.get("download") === "1" ? { "Content-Disposition": `attachment; filename="hadahana-${id.replace(/[^a-zA-Z0-9-]/g, "")}.json"` } : {}) } });
  } catch(e) { return accountFailure(e); }
}
