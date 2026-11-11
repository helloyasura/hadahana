import { z } from "zod";
import {
  authenticatedOwner,
  failure,
  jsonBody,
  requireLicense,
  response,
} from "@/lib/pro/http";
import {
  transaction,
  consumeRate,
  digest,
  newId,
  opaqueToken,
  ProError,
} from "@/lib/pro/store";
import { calculationConfigSchema } from "@/lib/astrology/config";
import { chartMetadataSchema } from "@/lib/pro/chart-metadata";
import { studioSettingsSchema } from "@/lib/pro/studio";
export const runtime = "nodejs";
const bodySchema = z.discriminatedUnion("action", [
  chartMetadataSchema.extend({ action: z.literal("chartMeta"), id: z.uuid() }),
  z.object({ action: z.literal("studio"), settings: studioSettingsSchema }),
  z.object({
    action: z.literal("profile"),
    displayName: z.string().trim().min(2).max(100),
    qualifications: z.string().max(500),
    contact: z.string().max(200),
    logo: z
      .string()
      .max(30000)
      .refine(
        (v) =>
          !v || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v),
      ),
  }),
  z.object({
    action: z.literal("preset"),
    name: z.string().trim().min(2).max(100),
    config: calculationConfigSchema,
    studio: studioSettingsSchema.optional(),
  }),
  z.object({
    action: z.literal("link"),
    presetId: z.uuid(),
    label: z.string().max(100),
    days: z.number().int().min(1).max(90),
    maxUses: z.number().int().min(1).max(100),
  }),
  z.object({ action: z.literal("revoke"), id: z.uuid() }),
  z.object({ action: z.literal("deleteClient"), id: z.uuid() }),
]);
export async function GET(req: Request) {
  try {
    const owner = await authenticatedOwner();
    // Read/export/delete are deliberately available after licence expiry.
    const id = new URL(req.url).searchParams.get("client");
    return response(
      await transaction((db) => {
        if (id) {
          const client = db.clients.find(
            (c) => c.id === id && c.ownerId === owner.id,
          );
          if (!client) throw new ProError("Not found", 404);
          return { client };
        }
        return {
          profile: {
            displayName: owner.displayName,
            qualifications: owner.qualifications,
            contact: owner.contact,
            logo: owner.logo,
          },
          studio: owner.studio ?? studioSettingsSchema.parse({}),
          presets: db.presets.filter((p) => p.ownerId === owner.id),
          links: db.links
            .filter((l) => l.ownerId === owner.id)
            .map(({ tokenHash: _hash, ...l }) => {
              void _hash;
              return l;
            }),
          clients: db.clients
            .filter((c) => c.ownerId === owner.id)
            .map((c) => ({
              id: c.id,
              createdAt: c.createdAt,
              presetId: c.presetId,
              lagna: c.result.lagna.rashiSinhala,
              label:
                c.label ??
                `සේවාලාභී · ${new Date(c.createdAt).toLocaleDateString("en-GB", { timeZone: "Asia/Colombo" })}`,
              tags: c.tags ?? [],
              notes: c.notes ?? "",
            })),
        };
      }),
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await jsonBody(req));
    const owner = await authenticatedOwner();
    if (
      !(await transaction((db) =>
        consumeRate(db, "workspace", owner.id, 60, 600),
      ))
    )
      throw new ProError("Too many requests", 429);
    if (body.action === "preset" || body.action === "link")
      await requireLicense(owner.subject);
    return response(
      await transaction((db) => {
        if (body.action === "chartMeta") {
          const client = db.clients.find(
            (c) => c.id === body.id && c.ownerId === owner.id,
          );
          if (!client) throw new ProError("Not found", 404);
          Object.assign(client, {
            label: body.label,
            tags: body.tags,
            notes: body.notes,
            updatedAt: Date.now(),
          });
        } else if (body.action === "studio") {
          db.accounts.find((a) => a.id === owner.id)!.studio = body.settings;
        } else if (body.action === "profile") {
          Object.assign(db.accounts.find((a) => a.id === owner.id)!, {
            displayName: body.displayName,
            qualifications: body.qualifications,
            contact: body.contact,
            logo: body.logo,
          });
        } else if (body.action === "preset") {
          const presets = db.presets.filter((p) => p.ownerId === owner.id);
          if (presets.length >= 50)
            throw new ProError("Pilot: maximum 50 preset versions", 409);
          const version =
            Math.max(
              0,
              ...presets
                .filter((p) => p.name === body.name)
                .map((p) => p.version),
            ) + 1;
          db.presets.push({
            id: newId(),
            ownerId: owner.id,
            name: body.name,
            version,
            config: body.config,
            ...(body.studio
              ? { studio: { ...body.studio, calculation: body.config } }
              : {}),
            createdAt: Date.now(),
          });
        } else if (body.action === "link") {
          if (
            !db.presets.some(
              (p) => p.id === body.presetId && p.ownerId === owner.id,
            )
          )
            throw new ProError("Preset not found", 404);
          if (db.links.filter((l) => l.ownerId === owner.id).length >= 100)
            throw new ProError("Pilot: maximum 100 links", 409);
          const token = opaqueToken();
          db.links.push({
            id: newId(),
            ownerId: owner.id,
            presetId: body.presetId,
            tokenHash: digest(token),
            label: body.label,
            expiresAt: Date.now() + body.days * 86400000,
            maxUses: body.maxUses,
            uses: 0,
            revoked: false,
            createdAt: Date.now(),
          });
          return { ok: true, token }; // plaintext is returned ONCE, never stored
        } else if (body.action === "revoke") {
          const link = db.links.find(
            (l) => l.id === body.id && l.ownerId === owner.id,
          );
          if (!link) throw new ProError("Not found", 404);
          link.revoked = true;
        } else if (body.action === "deleteClient") {
          if (
            !db.clients.some((c) => c.id === body.id && c.ownerId === owner.id)
          )
            throw new ProError("Not found", 404);
          db.clients = db.clients.filter(
            (c) => c.id !== body.id || c.ownerId !== owner.id,
          );
        }
        return { ok: true };
      }),
    );
  } catch (e) {
    return failure(e);
  }
}
