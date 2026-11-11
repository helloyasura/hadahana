import {
  authenticatedOwner,
  failure,
  jsonBody,
  response,
  requireLicense,
} from "@/lib/pro/http";
import { transaction, consumeRate, ProError } from "@/lib/pro/store";
import { defaultServices } from "@/lib/pro/cases";
import { castKendraya } from "@/lib/astrology/kendraya";
import { validateResolvedCivilTime } from "@/lib/pro/civil-time";
import {
  applyCaseAction,
  ownedCase,
  caseActionSchema,
} from "@/lib/pro/case-actions";
export const runtime = "nodejs";
export async function GET(req: Request) {
  try {
    const owner = await authenticatedOwner(),
      id = new URL(req.url).searchParams.get("id");
    return response(
      await transaction((db) => ({
        ownerId: owner.id,
        services:
          db.accounts.find((a) => a.id === owner.id)?.services ??
          defaultServices,
        ...(id
          ? { client: ownedCase(db, owner.id, id) }
          : {
              clients: db.clients
                .filter((c) => c.ownerId === owner.id)
                .map((c) => ({
                  id: c.id,
                  label: c.label || "සේවා ඉල්ලීම / Customer request",
                  tags: c.tags ?? [],
                  createdAt: c.createdAt,
                  source: c.linkId === "manual" ? "archive" : "incoming",
                  status: c.case!.status,
                  assignedTo: c.case!.assignedTo,
                  question: c.case!.question,
                  serviceId: c.case!.serviceId,
                })),
            }),
      })),
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const owner = await authenticatedOwner(),
      body = caseActionSchema.parse(await jsonBody(req));
    await requireLicense(owner.subject);
    if (
      !(await transaction((db) => consumeRate(db, "cases", owner.id, 80, 600)))
    )
      throw new ProError("Too many case updates", 429);
    if (body.action === "rectify") {
      await transaction((db) => {
        ownedCase(db, owner.id, body.id);
        if (!consumeRate(db, "studio", owner.id, 120, 600))
          throw new ProError("Too many chart requests", 429);
      });
      const result = await castKendraya(
        body.state.input,
        body.state.settings.calculation,
        { precise: true },
      );
      validateResolvedCivilTime(
        body.state.input.date,
        body.state.input.time,
        body.state.input.timezone,
        result.native.utcTime,
      );
    }
    return response(
      await transaction((db) => applyCaseAction(db, owner.id, body)),
    );
  } catch (e) {
    return failure(e);
  }
}
