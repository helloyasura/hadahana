import { NextResponse } from "next/server";
import { castKendraya } from "@/lib/astrology/kendraya";
import { birthSchema } from "@/lib/astrology/birth-schema";
import { fullChart } from "@/lib/account/chart";
import { currentProfile, sessionToken, lums, seal, configured, sameOrigin, PENDING_COOKIE, cookieOptions } from "@/lib/account/server";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: "Invalid request origin" }, { status: 403 });
  try {
    const body = birthSchema.parse(await req.json());
    if (JSON.stringify(body).length > 2000) return NextResponse.json({ ok: false, error: "Birth details too long" }, { status: 400 });
    let profile = null;
    try { profile = await currentProfile(); } catch { /* Public preview remains available during LUMS outages. */ }
    if (profile?.license.active) {
      const chart = await fullChart(body);
      const { id } = await lums<{ id: string }>("/horoscopes", await sessionToken(), { birth: body });
      const response = NextResponse.json({ ...chart, birth: body, horoscopeId: id }, { headers: { "Cache-Control": "no-store" } });
      response.cookies.set(PENDING_COOKIE, "", { ...cookieOptions, maxAge: 0 });
      return response;
    }
    // A public preview intentionally never contains the printable satahana,
    // naming guidance, predictions, dosha or the full chart export.
    const chart = await castKendraya(body);
    const response = NextResponse.json({ ok: true, preview: { lagna: { rashi: chart.lagna.rashi, rashiSinhala: chart.lagna.rashiSinhala }, chandra: { rashi: chart.chandra.rashi, rashiSinhala: chart.chandra.rashiSinhala } }, needsAccount: true }, { headers: { "Cache-Control": "no-store" } });
    if (configured()) response.cookies.set(PENDING_COOKIE, seal(body, "pending"), cookieOptions);
    return response;
  } catch { return NextResponse.json({ ok: false, error: "Unable to generate or save the horoscope. Check your details and try again." }, { status: 400 }); }
}
