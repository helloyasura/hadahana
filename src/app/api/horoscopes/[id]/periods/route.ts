import { NextResponse } from "next/server";
import { currentProfile, requireFeature, accountFailure } from "@/lib/account/server";
import { birthSchema } from "@/lib/astrology/birth-schema";
import { castKendraya } from "@/lib/astrology/kendraya";
import { difficultPeriods } from "@/lib/astrology/dosha-periods";
export const runtime = "nodejs";
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireFeature(req); if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const profile = await currentProfile();
    const saved = profile?.horoscopes.find(h => h.id === id);
    if (!saved) return NextResponse.json({ ok: false, error: "Horoscope not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    const birth = birthSchema.parse(saved.birth);
    if (birth.ayanamsa && birth.ayanamsa !== "lahiri") return NextResponse.json({ ok: false, error: "This traditional timing view currently supports Lahiri charts only." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const report = await difficultPeriods(await castKendraya(birth));
    return NextResponse.json({ ok: true, report }, { headers: { "Cache-Control": "no-store" } });
  } catch(e) { return accountFailure(e); }
}
