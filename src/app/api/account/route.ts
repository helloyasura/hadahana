import { NextResponse } from "next/server";
import { z } from "zod";
import { currentProfile, pendingBirth, lums, sameOrigin, accountFailure, AccountError, seal, configured, SESSION_COOKIE, PENDING_COOKIE, cookieOptions, pendingVerification, VERIFICATION_COOKIE } from "@/lib/account/server";
import type { Profile } from "@/lib/account/types";
export const runtime = "nodejs";
export async function GET() {
  try { return NextResponse.json({ ok: true, configured: configured(), profile: await currentProfile(), pendingVerification: !!await pendingVerification() }, { headers: { "Cache-Control": "no-store" } }); } catch(e) { return accountFailure(e); }
}
const input = z.object({ action: z.enum(["signup", "login", "logout", "verify-email", "resend-code"]), email: z.string().trim().email().max(254).optional(), password: z.string().min(8).max(72).optional(), code: z.string().regex(/^\d{6}$/).optional(), name: z.string().trim().min(1).max(120).optional() });
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: "Invalid request origin" }, { status: 403 });
  try {
    if (Number(req.headers.get("content-length")) > 8192) throw new AccountError("Request too large", 413);
    const body = input.parse(await req.json());
    if (body.action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
      response.cookies.set(VERIFICATION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
      response.cookies.set(PENDING_COOKIE, "", { ...cookieOptions, maxAge: 0 });
      return response;
    }
    const birth = await pendingBirth();
    let result: { token?: string; verificationRequired?: boolean; challengeId?: string; resendAfter?: number };
    if (body.action === "verify-email" || body.action === "resend-code") {
      const challengeId = await pendingVerification();
      if (!challengeId) throw new AccountError("Verification expired. Please start again.", 400);
      if (body.action === "verify-email" && !body.code) throw new AccountError("Enter the six-digit code", 400);
      result = await lums(`/${body.action}`, null, { challengeId, code: body.code });
    } else {
      if (!body.email || !body.password || (body.action === "signup" && !body.name)) throw new AccountError("Complete all required fields", 400);
      result = await lums(`/${body.action}`, null, { email: body.email, password: body.password, name: body.name, ...(body.action === "signup" && birth ? { birth } : {}) });
    }
    if (result.verificationRequired && result.challengeId) {
      const response = NextResponse.json({ ok: true, verificationRequired: true, resendAfter: result.resendAfter || 60 }, { headers: { "Cache-Control": "no-store" } });
      response.cookies.set(VERIFICATION_COOKIE, seal(result.challengeId, "verification"), { ...cookieOptions, maxAge: 600 });
      response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
      return response;
    }
    const token = result.token;
    if (!token) throw new AccountError("Account request failed. Please try again.");
    let profile = (await lums<{ profile: Profile }>("/me", token)).profile;
    let horoscopeId: string | undefined;
    let pendingSaved = false;
    if (birth && profile.license.active) {
      try { const saved = await lums<{ id: string }>("/horoscopes", token, { birth }); horoscopeId = saved.id; pendingSaved = true; profile = (await lums<{ profile: Profile }>("/me", token)).profile; } catch { /* Keep pending cookie for a retry; login itself still succeeds. */ }
    }
    const response = NextResponse.json({ ok: true, profile, pendingSaved, horoscopeId: horoscopeId || (pendingSaved ? profile.horoscopes[0]?.id : undefined) }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE, seal(token, "session"), cookieOptions);
    response.cookies.set(VERIFICATION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    if (pendingSaved) response.cookies.set(PENDING_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return response;
  } catch(e) { return accountFailure(e); }
}
