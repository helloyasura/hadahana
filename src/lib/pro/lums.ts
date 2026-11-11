import { z } from "zod";
import { isIP } from "node:net";
import { ProError } from "./store";
import {
  GENERIC_CODE_WAIT,
  parseProLimitFields,
  proLimitMessage,
} from "./limits";
/** Real LUMS Pro HTTP client; never uses consumer /hadahana auth. See docs/JYOTISHA_PRO.md.
 * No local trial or verification bypass. Missing upstream endpoints fail closed.
 */
const verifiedSchema = z.object({
  audience: z.literal("JYOTISHA_PRO"),
  verified: z.literal(true),
  subject: z.uuid(),
  email: z.email(),
});
const entitlementSchema = z.object({
  product: z.literal("JYOTISHA_PRO"),
  active: z.boolean(),
  expiresAt: z.iso.datetime(),
  kind: z.enum(["trial", "paid"]),
});
export async function proLums<T>(
  endpoint: string,
  body: unknown,
  schema: z.ZodType<T>,
  clientIp?: string,
): Promise<T> {
  const base = process.env.PRO_LUMS_API_URL,
    secret = process.env.PRO_LUMS_SERVICE_KEY;
  if (!base || !secret || secret.length < 32)
    throw new ProError(
      "Pro email verification / LUMS සම්බන්ධතාව තවම සකසා නැත.",
      503,
    );
  const url = new URL(base);
  if (
    url.protocol !== "https:" &&
    !(
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new ProError("Pro LUMS configuration is invalid.", 503);
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/jyotisha-pro${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
          ...(clientIp && isIP(clientIp)
            ? { "x-jyotisha-pro-client-ip": clientIp }
            : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
        redirect: "error",
      },
    );
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const details = parseProLimitFields(payload, res.headers.get("retry-after"));
      if (res.status === 429)
        throw new ProError(
          details.reason || details.retryAfterSeconds != null
            ? proLimitMessage(details)
            : GENERIC_CODE_WAIT,
          429,
          details,
        );
      if (details.reason === "too_many_attempts")
        throw new ProError(proLimitMessage(details), res.status, details);
      throw new ProError(
        res.status === 400 || res.status === 401
          ? "කේතය හෝ පිවිසුම් තොරතුරු වැරදියි."
          : "Pro LUMS සේවාව ලබාගත නොහැක.",
        res.status === 400 || res.status === 401 ? 401 : 503,
      );
    }
    return schema.parse(payload);
  } catch (e) {
    if (e instanceof ProError) throw e;
    throw new ProError("Pro LUMS සේවාව ලබාගත නොහැක.", 503);
  }
}
export const startVerification = (
  email: string,
  intent: "login" | "register",
  clientIp?: string,
) =>
  proLums(
    "/auth/start",
    { email, intent, audience: "JYOTISHA_PRO" },
    z.object({ challengeId: z.string().regex(/^[a-f0-9]{64}$/) }),
    clientIp,
  );
export const verifyEmail = (
  challengeId: string,
  code: string,
  clientIp?: string,
) =>
  proLums(
    "/auth/verify",
    { challengeId, code, audience: "JYOTISHA_PRO" },
    verifiedSchema,
    clientIp,
  );
export const entitlement = (subject: string) =>
  proLums(
    "/entitlement",
    { subject, product: "JYOTISHA_PRO", trialDays: 20 },
    entitlementSchema,
  );
