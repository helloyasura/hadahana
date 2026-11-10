import { cookies } from "next/headers";
import { z } from "zod";
import {
  jsonBody,
  response,
  failure,
  requestIdentity,
  PRO_COOKIE,
  PRO_PENDING,
  proCookieOptions,
} from "@/lib/pro/http";
import {
  transaction,
  consumeRate,
  digest,
  opaqueToken,
  newId,
  ProError,
} from "@/lib/pro/store";
import { startVerification, verifyEmail, entitlement } from "@/lib/pro/lums";
import { DEFAULT_CALCULATION_CONFIG } from "@/lib/astrology/config";
export const runtime = "nodejs";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    intent: z.enum(["login", "register"]),
    displayName: z.string().trim().min(2).max(100),
  }),
  z.object({ action: z.literal("verify"), code: z.string().regex(/^\d{6}$/) }),
  z.object({ action: z.literal("logout") }),
]);
export async function POST(req: Request) {
  try {
    const body = schema.parse(await jsonBody(req));
    const jar = await cookies();
    if (body.action === "logout") {
      const token = jar.get(PRO_COOKIE)?.value;
      await transaction((db) => {
        db.sessions = db.sessions.filter((s) => s.hash !== digest(token || ""));
      });
      const res = response({ ok: true });
      res.cookies.set(PRO_COOKIE, "", { ...proCookieOptions, maxAge: 0 });
      return res;
    }
    const allowed = await transaction((db) =>
      consumeRate(db, "auth-ip", requestIdentity(req), 30, 900),
    );
    if (!allowed)
      throw new ProError("කරුණාකර මිනිත්තු කිහිපයකින් උත්සාහ කරන්න.", 429);
    if (body.action === "start") {
      if (
        !(await transaction((db) =>
          consumeRate(db, "auth-email", body.email, 3, 3600),
        ))
      )
        throw new ProError("නව කේතයක් ඉල්ලීමට පෙර රැඳී සිටින්න.", 429);
      const remote = await startVerification(
        body.email,
        body.intent,
        requestIdentity(req),
      );
      const token = opaqueToken();
      await transaction((db) => {
        db.challenges = db.challenges.filter((c) => c.email !== body.email);
        if (db.challenges.length >= 500)
          throw new ProError("Pilot capacity reached", 503);
        db.challenges.push({
          hash: digest(token),
          email: body.email,
          displayName: body.displayName,
          intent: body.intent,
          remoteId: remote.challengeId,
          attempts: 0,
          expiresAt: Date.now() + 600000,
        });
      });
      const res = response({
        ok: true,
        message: "ඔබගේ ඊමේල් වෙත යැවූ අංක 6 කේතය ඇතුළත් කරන්න.",
      });
      res.cookies.set(PRO_PENDING, token, { ...proCookieOptions, maxAge: 600 });
      return res;
    }
    const pending = jar.get(PRO_PENDING)?.value;
    const challenge = await transaction((db) => {
      const c = db.challenges.find((c) => c.hash === digest(pending || ""));
      if (!c || c.attempts >= 5) return null;
      c.attempts++;
      return { ...c };
    });
    if (!challenge)
      throw new ProError("කේතය කල් ඉකුත් වී ඇත. නව කේතයක් ඉල්ලන්න.", 401);
    const verified = await verifyEmail(
      challenge.remoteId,
      body.code,
      requestIdentity(req),
    );
    if (verified.email.toLowerCase() !== challenge.email)
      throw new ProError("Verification mismatch", 401);
    // LUMS issues the one-time 20-day trial inside verified signup. This call is read-only.
    if (challenge.intent === "register") await entitlement(verified.subject);
    const token = opaqueToken();
    await transaction((db) => {
      if (!db.challenges.some((c) => c.hash === challenge.hash))
        throw new ProError("Code already used", 401);
      if (
        db.accounts.some(
          (a) => a.subject === verified.subject && a.email !== challenge.email,
        )
      )
        throw new ProError("Verification mismatch", 401);
      let account = db.accounts.find((a) => a.email === challenge.email);
      if (account && account.subject !== verified.subject)
        throw new ProError("Verification mismatch", 401);
      if (!account) {
        if (challenge.intent !== "register")
          throw new ProError("පළමුව Pro ගිණුමක් ලියාපදිංචි කරන්න.", 401);
        if (db.accounts.length >= 500)
          throw new ProError("Private pilot capacity reached", 409);
        account = {
          id: newId(),
          subject: verified.subject,
          email: challenge.email,
          displayName: challenge.displayName,
          qualifications: "",
          contact: "",
          logo: "",
          createdAt: Date.now(),
        };
        db.accounts.push(account);
        db.presets.push({
          id: newId(),
          ownerId: account.id,
          name: "Hadahana default",
          version: 1,
          config: { ...DEFAULT_CALCULATION_CONFIG },
          createdAt: Date.now(),
        });
      }
      db.sessions = db.sessions.filter((s) => s.ownerId !== account.id); // one active session in pilot
      db.sessions.push({
        hash: digest(token),
        ownerId: account.id,
        expiresAt: Date.now() + 43200000,
      });
      db.challenges = db.challenges.filter((c) => c.hash !== challenge.hash);
    });
    const res = response({ ok: true });
    res.cookies.set(PRO_COOKIE, token, proCookieOptions);
    res.cookies.set(PRO_PENDING, "", { ...proCookieOptions, maxAge: 0 });
    return res;
  } catch (e) {
    return failure(e);
  }
}
