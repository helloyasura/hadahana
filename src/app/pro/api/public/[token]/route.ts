import { validateResolvedCivilTime } from "@/lib/pro/civil-time";
import { z } from "zod";
import { documentUploadSchema, sanitizeDocument } from "@/lib/pro/document";
import { initialCase } from "@/lib/pro/cases";
import {
  failure,
  jsonBody,
  requireLicense,
  requestIdentity,
  response,
} from "@/lib/pro/http";
import {
  transaction,
  consumeRate,
  usableLink,
  newId,
  digest,
  ProError,
} from "@/lib/pro/store";
import { castKendraya } from "@/lib/astrology/kendraya";
import { configuredBirthSunrise } from "@/lib/astrology/configured-positions";
import { splitDashaYears } from "@/lib/astrology/vimshottari";
export const runtime = "nodejs";
type Context = { params: Promise<{ token: string }> };
const inputSchema = z
  .object({
    consent: z.literal(true),
    question: z.string().trim().max(2000).default(""),
    timeUnsure: z.boolean().default(false),
    placeLabel: z.string().trim().max(100).default(""),
    document: documentUploadSchema.optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (s) =>
          s >= "1900-01-01" &&
          s <= new Date().toISOString().slice(0, 10) &&
          new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s,
      ),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    latitude: z.number().min(-65).max(65),
    longitude: z.number().min(-180).max(180),
    timezone: z
      .string()
      .max(80)
      .refine((t) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: t });
          return true;
        } catch {
          return false;
        }
      }),
  })
  .strict();
async function lookup(token: string, req: Request) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new ProError("සබැඳිය වැරදියි.", 404);
  if (
    !(await transaction((db) =>
      consumeRate(db, "public-read", requestIdentity(req), 120, 600),
    ))
  )
    throw new ProError("කරුණාකර මඳ වේලාවකින් උත්සාහ කරන්න.", 429);
  return transaction((db) => {
    const link = usableLink(db, token),
      preset = db.presets.find(
        (p) => p.id === link.presetId && p.ownerId === link.ownerId,
      )!;
    const owner = db.accounts.find((a) => a.id === link.ownerId)!;
    return { link, preset, owner };
  });
}
export async function GET(req: Request, ctx: Context) {
  try {
    const { token } = await ctx.params,
      { owner, preset } = await lookup(token, req);
    return response({
      displayName: owner.displayName,
      logo: owner.logo,
      preset: {
        name: preset.name,
        version: preset.version,
        config: preset.config,
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request, ctx: Context) {
  try {
    const body = inputSchema.parse(await jsonBody(req, 3 * 1024 * 1024));
    const { token } = await ctx.params,
      { owner, preset, link } = await lookup(token, req);
    const allowed = await transaction((db) => {
      const global = consumeRate(db, "calculation-global", "all", 30, 600);
      const perLink = consumeRate(db, "calculation-link", link.id, 6, 600);
      return global && perLink;
    });
    if (!allowed)
      throw new ProError(
        "ගණනය කිරීම් සීමාවට පැමිණ ඇත. මඳ වේලාවකින් උත්සාහ කරන්න.",
        429,
      );
    await requireLicense(owner.subject);
    // Consume a use BEFORE work to make maxUses race-safe and bound CPU. Failed attempts count.
    await transaction((db) => {
      const current = usableLink(db, token);
      if (db.clients.filter((c) => c.ownerId === owner.id).length >= 100)
        throw new ProError("මෙම ජෝතිෂ්‍යවේදියාගේ client සීමාවට පැමිණ ඇත.", 409);
      current.uses++;
    });
    const { consent: _consent, question, timeUnsure, placeLabel, document: upload, ...input } = body;
    void _consent;
    let document: Awaited<ReturnType<typeof sanitizeDocument>> | undefined;
    if (upload) { try { document = await sanitizeDocument(upload); } catch { throw new ProError("Invalid document: JPEG/PNG/WebP or unencrypted PDF (1–4 pages), maximum 2MB. Conversion must fit safe limits."); } }

    const result = await castKendraya(input, preset.config);
    validateResolvedCivilTime(
      input.date,
      input.time,
      input.timezone,
      result.native.utcTime,
    );
    const timing = configuredBirthSunrise(
      result.native.utcTime,
      input.latitude,
      input.longitude,
      input.timezone,
      preset.config,
    );
    const balanceYears =
      (Date.parse(result.vimshottari.balanceAtBirth.endUtc) -
        Date.parse(result.vimshottari.balanceAtBirth.startUtc)) /
      (preset.config.dasaYearDays * 86400000);
    const manifest = {
      config: preset.config,
      configHash: digest(JSON.stringify(preset.config)),
      engine: "hadahana-pro-v1/vpv-1.0.0",
      sunriseUtc: timing.sunrise,
      balanceDisplay:
        preset.config.balanceDisplay === "decimal-years"
          ? `${balanceYears.toFixed(4)} years`
          : (() => {
              const d = splitDashaYears(
                balanceYears,
                preset.config.dasaYearDays,
              );
              return `${d.y} වසර / ${d.m} මාස / ${d.d} දින`;
            })(),
    };
    await transaction((db) => {
      const current = db.links.find((l) => l.id === link.id);
      if (!current || current.revoked || current.expiresAt <= Date.now())
        throw new ProError("සබැඳිය අවලංගු වී ඇත.", 410);
      if (db.clients.filter((c) => c.ownerId === owner.id).length >= 100)
        throw new ProError("Client limit reached", 409);
      db.clients.push({
        id: newId(),
        ownerId: owner.id,
        linkId: link.id,
        presetId: preset.id,
        input,
        case: { ...initialCase({ input, manifest, createdAt: Date.now() }), question, timeUnsure, placeLabel, ...(document ? { document } : {}) },
        result,
        manifest,
        consentVersion: "pro-v1",
        createdAt: Date.now(),
      });
    });
    return response({
      result,
      manifest,
      calculatedPer: owner.displayName,
      presetName: preset.name,
      presetVersion: preset.version,
    });
  } catch (e) {
    return failure(e);
  }
}
