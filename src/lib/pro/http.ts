import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_PATH } from "../base-path";
import { digest, ProError, transaction, type ProStore } from "./store";
import { entitlement } from "./lums";
export const PRO_COOKIE = "jyotisha_pro_session";
export const PRO_PENDING = "jyotisha_pro_verification";
export const proCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: `${BASE_PATH}/pro`,
  maxAge: 43200,
};
export const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};
export function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: privateHeaders });
}
export function failure(e: unknown) {
  const err = e instanceof ProError ? e : undefined;
  const res = response(
    {
      error: err
        ? err.message
        : "ඉල්ලීම සම්පූර්ණ කළ නොහැක. නැවත උත්සාහ කරන්න.",
      ...(err?.reason ? { reason: err.reason } : {}),
      ...(err?.retryAfterSeconds != null
        ? { retryAfterSeconds: err.retryAfterSeconds }
        : {}),
      ...(err?.limit != null ? { limit: err.limit } : {}),
    },
    err ? err.status : 400,
  );
  if (err?.retryAfterSeconds != null && err.retryAfterSeconds >= 0)
    res.headers.set("Retry-After", String(err.retryAfterSeconds));
  return res;
}
export function originGuard(req: Request) {
  let expected = process.env.PRO_PUBLIC_ORIGIN;
  if (!expected && process.env.NODE_ENV !== "production")
    expected = new URL(req.url).origin;
  if (
    !expected ||
    req.headers.get("origin") !== expected ||
    req.headers.get("x-jyotisha-pro") !== "1" ||
    !req.headers.get("content-type")?.startsWith("application/json") ||
    req.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new ProError("Invalid request origin", 403);
}
export async function jsonBody(req: Request, maxBytes = 40000) {
  originGuard(req);
  // Bound actual streamed bytes too; Content-Length alone can be absent/forged.
  if (!req.body) throw new ProError("Empty request");
  const reader = req.body.getReader();
  let total = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ProError("Request too large", 413);
    }
    parts.push(value);
  }
  return JSON.parse(Buffer.concat(parts).toString());
}
export function requestIdentity(req: Request) {
  // Do not trust arbitrary forwarded headers unless the deployment sanitizes them.
  return process.env.PRO_TRUST_PROXY === "1"
    ? req.headers.get("x-real-ip") || "shared"
    : "shared";
}
export function ownerFromSession(db: ProStore, token: string | undefined) {
  if (!token) throw new ProError("Pro ගිණුමට පිවිසෙන්න.", 401);
  const session = db.sessions.find(
    (s) => s.hash === digest(token) && s.expiresAt > Date.now(),
  );
  const account = db.accounts.find((a) => a.id === session?.ownerId);
  if (!account) throw new ProError("Pro ගිණුමට පිවිසෙන්න.", 401);
  return account;
}
export async function authenticatedOwner() {
  const token = (await cookies()).get(PRO_COOKIE)?.value;
  return transaction((db) => ownerFromSession(db, token));
}
export async function requireLicense(subject: string) {
  const license = await entitlement(subject);
  if (!license.active || Date.parse(license.expiresAt) <= Date.now())
    throw new ProError(
      "Pro trial / බලපත්‍රය අවසන්. LUMS වෙතින් අලුත් කරන්න.",
      402,
    );
  return license;
}
