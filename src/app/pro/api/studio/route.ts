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
import { studioBirthSchema } from "@/lib/pro/input";
import { castKendraya } from "@/lib/astrology/kendraya";
import { validateResolvedCivilTime } from "@/lib/pro/civil-time";
export const runtime = "nodejs";
const schema = z.object({
  input: studioBirthSchema,
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
    const result = await castKendraya(body.input, body.config, {
      precise: true,
    });
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
