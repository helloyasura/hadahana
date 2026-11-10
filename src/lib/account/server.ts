import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { configured, seal, unseal } from "./crypto";
import type { Profile } from "./types";
import type { BirthBody } from "../astrology/birth-schema";
export const SESSION_COOKIE = "hadahana_session";
export const VERIFICATION_COOKIE = "hadahana_verification";
export const PENDING_COOKIE = "hadahana_pending";
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/hadahana", maxAge: 86400 };
export class AccountError extends Error { constructor(message: string, public status = 503) { super(message); } }
export function sameOrigin(req: Request) {
  // All browser mutations use JSON + a custom header, so neither HTML forms nor
  // cross-origin simple requests can exercise cookie-authenticated actions.
  return req.headers.get("x-hadahana-action") === "1" && req.headers.get("content-type")?.includes("application/json") && req.headers.get("sec-fetch-site") !== "cross-site";
}
export async function lums<T>(path: string, token?: string | null, body?: unknown): Promise<T> {
  if (!configured()) throw new AccountError("Profiles are not configured yet. Please try later.");
  const base = process.env.LUMS_API_URL!.replace(/\/$/, "");
  const url = new URL(base);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["127.0.0.1", "localhost"].includes(url.hostname))) throw new AccountError("Profiles are not configured correctly.");
  let res: Response;
  try {
    res = await fetch(`${base}/hadahana${path}`, { method: body === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(10000), redirect: "error" });
  } catch { throw new AccountError("LUMS is temporarily unavailable. Your saved horoscopes are safe."); }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AccountError(json.error?.message || json.error || json.message || "Account request failed", res.status);
  return json as T;
}
export async function sessionToken() { return unseal<string>((await cookies()).get(SESSION_COOKIE)?.value, "session"); }
export async function pendingVerification() { return unseal<string>((await cookies()).get(VERIFICATION_COOKIE)?.value, "verification"); }
export async function pendingBirth() { return unseal<BirthBody>((await cookies()).get(PENDING_COOKIE)?.value, "pending"); }
export async function currentProfile(): Promise<Profile | null> {
  const token = await sessionToken();
  if (!token) return null;
  try { return (await lums<{ profile: Profile }>("/me", token)).profile; } catch(e) { if (e instanceof AccountError && e.status === 401) return null; throw e; }
}
export function accountFailure(e: unknown) { return NextResponse.json({ ok: false, error: e instanceof AccountError ? e.message : "Account request failed. Please try again.", portalUrl: "https://lums.ervanta.com/portal" }, { status: e instanceof AccountError ? e.status : 400, headers: { "Cache-Control": "no-store" } }); }
export async function requireFeature(req: Request) {
  if (req.method !== "GET" && !sameOrigin(req)) return NextResponse.json({ ok: false, error: "Invalid request origin" }, { status: 403 });
  try {
    const profile = await currentProfile();
    if (!profile) throw new AccountError("Sign in to use this feature.", 401);
    if (!profile.license.active) throw new AccountError("Your trial or license has ended. Buy or renew a license in LUMS.", 402);
    if (!profile.horoscopes.length) throw new AccountError("Generate your horoscope first to unlock the studio.", 403);
    return null;
  } catch(e) { return accountFailure(e); }
}
export { configured, seal };
