import { NextResponse } from "next/server";
import { castKendraya } from "@/lib/astrology/kendraya";
import { analyzeDoshaYoga } from "@/lib/astrology/dosha";
import { buildPalapala } from "@/lib/astrology/palapala";
import { buildSatahana } from "@/lib/astrology/satahana";
import { birthSchema } from "@/lib/astrology/birth-schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = birthSchema.parse(await req.json());
    const [chart, satahana] = await Promise.all([
      castKendraya(body),
      buildSatahana(body),
    ]);
    const dosha = analyzeDoshaYoga(chart);
    const palapala = buildPalapala(chart);
    return NextResponse.json({ ok: true, chart, dosha, palapala, satahana });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
