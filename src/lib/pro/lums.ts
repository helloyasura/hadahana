import { z } from "zod";
import { ProError } from "./store";
/** Integration seam, NOT wired to consumer /hadahana auth. See docs/JYOTISHA_PRO.md.
 * No local trial or verification bypass. Missing upstream endpoints fail closed.
 */
const verifiedSchema = z.object({
  audience: z.literal("JYOTISHA_PRO"),
  verified: z.literal(true),
  subject: z.string().min(1).max(200),
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
): Promise<T> {
  const base = process.env.PRO_LUMS_API_URL,
    secret = process.env.PRO_LUMS_SERVICE_KEY;
  if (!base || !secret)
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
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
        redirect: "error",
      },
    );
    if (!res.ok)
      throw new ProError(
        res.status === 400 || res.status === 401
          ? "කේතය හෝ පිවිසුම් තොරතුරු වැරදියි."
          : "Pro LUMS සේවාව ලබාගත නොහැක.",
        res.status === 400 || res.status === 401 ? 401 : 503,
      );
    return schema.parse(await res.json());
  } catch (e) {
    if (e instanceof ProError) throw e;
    throw new ProError("Pro LUMS සේවාව ලබාගත නොහැක.", 503);
  }
}
export const startVerification = (email: string, intent: string) =>
  proLums(
    "/auth/start",
    { email, intent, audience: "JYOTISHA_PRO" },
    z.object({ challengeId: z.string().min(16).max(500) }),
  );
export const verifyEmail = (challengeId: string, code: string) =>
  proLums(
    "/auth/verify",
    { challengeId, code, audience: "JYOTISHA_PRO" },
    verifiedSchema,
  );
export const entitlement = (subject: string) =>
  proLums(
    "/entitlement",
    { subject, product: "JYOTISHA_PRO", trialDays: 20 },
    entitlementSchema,
  );
