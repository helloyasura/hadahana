import { z } from "zod";
import {
  authenticatedOwner,
  failure,
  jsonBody,
  requireLicense,
  response,
} from "@/lib/pro/http";
import { consumeRate, ProError, transaction } from "@/lib/pro/store";
import { calculationConfigSchema } from "@/lib/astrology/config";
import {
  ephemerisSampler,
  findIngress,
  skyAt,
  TRANSIT_BODIES,
} from "@/lib/pro/transits";
export const runtime = "nodejs";
const instant = z.iso.datetime().refine((v) => {
  const n = Date.parse(v);
  return (
    n >= Date.parse("1800-01-01T00:00:00Z") &&
    n < Date.parse("2201-01-01T00:00:00Z")
  );
});
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("sky"),
    instant,
    config: calculationConfigSchema,
  }),
  z.object({
    action: z.literal("ingress"),
    from: instant,
    to: instant,
    planet: z.enum(TRANSIT_BODIES),
    target: z.number().int().min(0).max(11),
    config: calculationConfigSchema,
  }),
]);
export async function POST(req: Request) {
  try {
    const owner = await authenticatedOwner(),
      body = schema.parse(await jsonBody(req));
    if (
      !(await transaction((db) =>
        consumeRate(db, "transits", owner.id, 30, 600),
      ))
    )
      throw new ProError("Too many transit requests", 429);
    await requireLicense(owner.subject);
    if (body.action === "sky")
      return response({
        bodies: await skyAt(Date.parse(body.instant), body.config),
        instant: body.instant,
      });
    const sampler = await ephemerisSampler(body.config, body.planet);
    return response({
      entry: findIngress(
        sampler,
        Date.parse(body.from),
        Date.parse(body.to),
        body.target,
      ),
    });
  } catch (e) {
    return failure(e);
  }
}
