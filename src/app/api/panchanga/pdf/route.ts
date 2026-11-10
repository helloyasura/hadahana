import { NextResponse } from "next/server";
import { currentProfile, accountFailure, AccountError, sameOrigin } from "@/lib/account/server";
import { getPanchanga } from "@/lib/astrology/panchanga";
import { panchangaSchema } from "@/lib/astrology/panchanga-schema";
import { pdfOptions } from "@/lib/pdf/options";
import { panchangaPdfTemplate } from "@/lib/pdf/panchanga-template";
import { admitPdf, renderPdf } from "@/lib/pdf/renderer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) throw new AccountError("Invalid request origin", 403);
    const profile = await currentProfile();
    if (!profile) throw new AccountError("Sign in to download Panchanga.", 401);
    if (!profile.license.active) throw new AccountError("An active trial or license is required.", 402);
    if (!profile.horoscopes.length) throw new AccountError("Generate a horoscope first.", 403);
    // Limit the body while reading, not only by its optional Content-Length header.
    const reader = req.body?.getReader(); if (!reader) throw new AccountError("Invalid Panchanga input", 400);
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 4096) { await reader.cancel(); throw new AccountError("Request too large", 413); } chunks.push(value); }
    } finally { reader.releaseLock(); }
    let input, options;
    const params = new URL(req.url).searchParams;
    try { input = panchangaSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8"))); options = pdfOptions(params); }
    catch { throw new AccountError("Invalid date, location, paper size or orientation", 400); }
    admitPdf(profile.id); // Shares the horoscope PDF budget and bounded Chromium queue.
    const data = await getPanchanga(input); // Never accept client HTML, computed results or arbitrary URLs.
    const pdf = await renderPdf(panchangaPdfTemplate(data, options.size, options.orientation));
    return new NextResponse(new Uint8Array(pdf), { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `${params.get("download") === "1" ? "attachment" : "inline"}; filename="panchanga-${input.date}-${options.size}.pdf"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin", "X-Frame-Options": "SAMEORIGIN", "Content-Security-Policy": "frame-ancestors 'self'",
    } });
  } catch (error) {
    const response = accountFailure(error instanceof AccountError ? error : new AccountError("Unable to render the PDF. Please try again shortly.", 503));
    if (response.status === 429 || response.status === 503) response.headers.set("Retry-After", response.status === 429 ? "600" : "5");
    return response;
  }
}
