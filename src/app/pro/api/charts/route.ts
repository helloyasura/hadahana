import { z } from "zod";
import {
  authenticatedOwner,
  failure,
  jsonBody,
  requireLicense,
  response,
} from "@/lib/pro/http";
import {
  consumeRate,
  digest,
  newId,
  ProError,
  transaction,
} from "@/lib/pro/store";
import { studioBirthSchema } from "@/lib/pro/input";
import { chartMetadataSchema } from "@/lib/pro/chart-metadata";
import { calculationConfigSchema } from "@/lib/astrology/config";
import { castKendraya } from "@/lib/astrology/kendraya";
import { configuredBirthSunrise } from "@/lib/astrology/configured-positions";
import { validateResolvedCivilTime } from "@/lib/pro/civil-time";
export const runtime = "nodejs";
const schema = chartMetadataSchema.extend({
  input: studioBirthSchema,
  config: calculationConfigSchema,
  consent: z.literal(true),
});
export async function POST(req: Request) {
  try {
    const owner = await authenticatedOwner(),
      body = schema.parse(await jsonBody(req));
    if (
      !(await transaction((db) =>
        consumeRate(db, "save-chart", owner.id, 30, 600),
      ))
    )
      throw new ProError("Too many saves", 429);
    await requireLicense(owner.subject);
    const result = await castKendraya(body.input, body.config, {
      precise: true,
    });
    validateResolvedCivilTime(
      body.input.date,
      body.input.time,
      body.input.timezone,
      result.native.utcTime,
    );
    const sunrise = configuredBirthSunrise(
        result.native.utcTime,
        body.input.latitude,
        body.input.longitude,
        body.input.timezone,
        body.config,
      ),
      id = newId();
    await transaction((db) => {
      if (db.clients.filter((c) => c.ownerId === owner.id).length >= 100)
        throw new ProError("Maximum 100 retained charts", 409);
      db.clients.push({
        id,
        ownerId: owner.id,
        linkId: "manual",
        presetId: "manual",
        input: body.input,
        createdAt: Date.now(),
        consentVersion: "pro-v1",
        label: body.label,
        tags: body.tags,
        notes: body.notes,
        result,
        manifest: {
          config: body.config,
          configHash: digest(JSON.stringify(body.config)),
          engine: result.tradition.ephemeris,
          sunriseUtc: sunrise.sunrise,
          balanceDisplay: body.config.balanceDisplay,
        },
      });
    });
    return response({ id });
  } catch (e) {
    return failure(e);
  }
}
