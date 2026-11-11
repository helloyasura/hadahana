import { z } from "zod";
import {
  authenticatedOwner,
  failure,
  jsonBody,
  requireLicense,
  response,
} from "@/lib/pro/http";
import { consumeRate, ProError, transaction } from "@/lib/pro/store";
import { civilDateSchema, studioBirthSchema } from "@/lib/pro/input";
import { getPanchanga } from "@/lib/astrology/panchanga";
import { matchPorondam } from "@/lib/astrology/porondam";
import {
  scanEventDates,
  EVENT_CATEGORIES,
  type EventCategoryId,
} from "@/lib/astrology/event-nakath";
import { castKendraya } from "@/lib/astrology/kendraya";
import { validateResolvedCivilTime } from "@/lib/pro/civil-time";
export const runtime = "nodejs";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("panchanga"), input: studioBirthSchema }),
  z.object({
    action: z.literal("match"),
    a: studioBirthSchema,
    b: studioBirthSchema,
  }),
  z.object({
    action: z.literal("nakath"),
    birth: studioBirthSchema,
    fromDate: civilDateSchema,
    toDate: civilDateSchema,
    eventId: z.enum(
      EVENT_CATEGORIES.map((e) => e.id) as [
        EventCategoryId,
        ...EventCategoryId[],
      ],
    ),
  }),
]);
async function validateBirth(input: z.infer<typeof studioBirthSchema>) {
  const c = await castKendraya(input);
  validateResolvedCivilTime(
    input.date,
    input.time,
    input.timezone,
    c.native.utcTime,
  );
}
export async function POST(req: Request) {
  try {
    const owner = await authenticatedOwner(),
      body = schema.parse(await jsonBody(req));
    if (
      !(await transaction((db) => consumeRate(db, "tools", owner.id, 30, 600)))
    )
      throw new ProError("Too many consultation requests", 429);
    await requireLicense(owner.subject);
    if (body.action === "panchanga")
      return response({
        panchanga: await getPanchanga(body.input),
        convention: "Lahiri / existing Sri Lankan daily engine",
      });
    if (body.action === "match") {
      await validateBirth(body.a);
      await validateBirth(body.b);
      return response({ matching: await matchPorondam(body.a, body.b) });
    }
    const days =
      (Date.parse(`${body.toDate}T00:00:00Z`) -
        Date.parse(`${body.fromDate}T00:00:00Z`)) /
      86400000;
    if (days < 0 || days > 30)
      throw new ProError("Select 1–31 inclusive days", 400);
    await validateBirth(body.birth);
    return response({
      nakath: await scanEventDates({
        ...body,
        limit: 31,
        latitude: body.birth.latitude,
        longitude: body.birth.longitude,
        timezone: body.birth.timezone,
      }),
    });
  } catch (e) {
    return failure(e);
  }
}
