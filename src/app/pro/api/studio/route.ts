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
import { birthSchema } from "@/lib/astrology/birth-schema";
import { castKendraya } from "@/lib/astrology/kendraya";
import { validateResolvedCivilTime } from "@/lib/pro/civil-time";
export const runtime = "nodejs";
const schema = z.object({
  input: birthSchema.extend({
    latitude: z.number().min(-89).max(89),
    longitude: z.number().min(-180).max(180),
    timezone: z
      .string()
      .min(1)
      .max(80)
      .refine((v) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: v });
          return true;
        } catch {
          return false;
        }
      }),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((v) => {
        const d = new Date(`${v}T12:00:00Z`);
        return (
          Number.isFinite(+d) &&
          d.toISOString().slice(0, 10) === v &&
          +v.slice(0, 4) >= 1800 &&
          +v.slice(0, 4) <= 2200
        );
      }),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }),
  config: calculationConfigSchema,
});
export async function POST(req: Request) {
  try {
    const owner = await authenticatedOwner();
    const body = schema.parse(await jsonBody(req));
    if (
      !(await transaction((db) =>
        consumeRate(db, "studio", owner.id, 120, 600),
      ))
    )
      throw new ProError(
        "වැඩබිම කාර්යබහුලයි. මඳක් රැඳී සිටින්න. / Too many chart requests",
        429,
      );
    await requireLicense(owner.subject);
    // Reuse the installed engine, including its configured true-node correction.
    // Birth inputs/results are not persisted, logged, or exposed through public links.
    const result = await castKendraya(body.input, body.config, { precise: true });
    validateResolvedCivilTime(
      body.input.date,
      body.input.time,
      body.input.timezone,
      result.native.utcTime,
    );
    return response({ result });
  } catch (error) {
    return failure(error);
  }
}
