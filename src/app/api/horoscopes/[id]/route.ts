import { NextResponse } from "next/server";
import { currentProfile, requireFeature, accountFailure } from "@/lib/account/server";
import { birthSchema } from "@/lib/astrology/birth-schema";
import { fullChart } from "@/lib/account/chart";
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireFeature(req); if (denied) return denied;
  try {
    if (new URL(req.url).searchParams.has("download")) return NextResponse.json({ ok: false, error: "JSON export has been removed. Use the PDF download." }, { status: 410, headers: { "Cache-Control": "no-store" } });
    const { id } = await ctx.params;
    const profile = await currentProfile();
    const saved = profile?.horoscopes.find(h => h.id === id);
    if (!saved) return NextResponse.json({ ok: false, error: "Horoscope not found" }, { status: 404 });
    const chart = { ...await fullChart(birthSchema.parse(saved.birth)), birth: saved.birth, horoscopeId: id };
    return NextResponse.json(chart, { headers: { "Cache-Control": "no-store" } });
  } catch(e) { return accountFailure(e); }
}
