import { NextResponse } from "next/server";
import { currentProfile, accountFailure, AccountError } from "@/lib/account/server";
import { birthSchema } from "@/lib/astrology/birth-schema";
import { buildSatahana } from "@/lib/astrology/satahana";
import { pdfOptions } from "@/lib/pdf/options";
import { pdfTemplate } from "@/lib/pdf/template";
import { admitPdf, renderPdf } from "@/lib/pdf/renderer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (req.headers.get("sec-fetch-site") === "cross-site") throw new AccountError("Invalid request origin", 403);
    // Same server-side checks as requireFeature, against a single fresh LUMS profile.
    const profile = await currentProfile();
    if (!profile) throw new AccountError("Sign in to download your horoscope.", 401);
    if (!profile.license.active) throw new AccountError("An active trial or license is required.", 402);
    if (!profile.horoscopes.length) throw new AccountError("Generate a horoscope first.", 403);
    const { id } = await ctx.params;
    const saved = profile.horoscopes.find(h => h.id === id);
    if (!saved) throw new AccountError("Horoscope not found", 404);
    const params = new URL(req.url).searchParams;
    let options;
    try { options = pdfOptions(params); } catch { throw new AccountError("Invalid paper size or orientation", 400); }
    admitPdf(profile.id);
    // Recompute only from the owned record in LUMS. Never accept client HTML or chart data.
    const data = await buildSatahana(birthSchema.parse(saved.birth));
    const pdf = await renderPdf(pdfTemplate(data, options.size, options.orientation));
    const filename = `hadahana-${id.replace(/[^a-zA-Z0-9-]/g, "").slice(0,64) || "chart"}-${options.size}.pdf`;
    return new NextResponse(new Uint8Array(pdf), { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `${params.get("download") === "1" ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin", "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
    } });
  } catch (error) {
    const response = accountFailure(error instanceof AccountError ? error : new AccountError("Unable to render the PDF. Please try again shortly.", 503));
    if (response.status === 429 || response.status === 503) response.headers.set("Retry-After", response.status === 429 ? "600" : "5");
    return response;
  }
}
