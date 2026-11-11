import { z } from "zod";
import { documentReadingSchema } from "./document-reading";
import {
  caseStudioSchema,
  caseStatuses,
  serviceKindSchema,
  defaultServices,
  checklist,
  canComplete,
  recordCaseStep,
  type CaseFile,
} from "./cases";
import { newId, ProError, type ProStore } from "./store";
const target = { id: z.uuid(), revision: z.number().int().nonnegative() };
export const caseActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("service"),
    name: z.string().trim().min(2).max(100),
    kind: serviceKindSchema,
  }),
  z.object({
    ...target,
    action: z.literal("update"),
    status: z.enum(caseStatuses),
    claim: z.boolean(),
    serviceId: z.string().max(80),
    question: z.string().max(2000),
    notes: z.string().max(6000),
    checked: z.array(z.string().max(40)).max(20),
  }),
  z.object({ ...target, action: z.literal("state"), state: caseStudioSchema }),
  z.object({
    ...target,
    action: z.literal("documentReading"),
    reading: documentReadingSchema,
  }),
  z.object({
    ...target,
    action: z.literal("rectify"),
    state: caseStudioSchema,
    reason: z.string().trim().min(10).max(1000),
    confirmed: z.literal(true),
  }),
  z.object({
    ...target,
    action: z.literal("pin"),
    title: z.string().trim().min(2).max(100),
    text: z.string().trim().min(1).max(2000),
    state: caseStudioSchema,
  }),
  z.object({ ...target, action: z.literal("removePin"), findingId: z.uuid() }),
  z.object({ ...target, action: z.literal("removeDocument") }),
  z.object({
    ...target,
    action: z.literal("report"),
    title: z.string().trim().min(2).max(100),
    body: z.string().trim().min(1).max(8000),
    language: z.enum(["si", "en"]),
    stage: z.enum(["draft", "final"]),
    reviewed: z.boolean(),
  }),
]);
export function ownedCase(db: ProStore, ownerId: string, id: string) {
  const client = db.clients.find((c) => c.id === id && c.ownerId === ownerId);
  if (!client?.case) throw new ProError("Case not found", 404);
  return client as typeof client & { case: CaseFile };
}
export function applyCaseAction(db: ProStore, ownerId: string, raw: unknown) {
  const body = caseActionSchema.parse(raw);
  const account = db.accounts.find((a) => a.id === ownerId);
  if (!account) throw new ProError("Not found", 404);
  const services = account.services ?? defaultServices;
  if (body.action === "service") {
    if (services.length >= 20)
      throw new ProError("Maximum 20 service types", 409);
    account.services = [
      ...services,
      { id: newId(), name: body.name, kind: body.kind },
    ];
    return { services: account.services };
  }
  const c = ownedCase(db, ownerId, body.id),
    file = c.case;
  if (file.revision !== body.revision)
    throw new ProError(
      "Case changed in another tab. Reload before saving. / වෙනත් ටැබයක වෙනස් වී ඇත.",
      409,
    );
  if (body.action === "update") {
    const service = services.find((s) => s.id === body.serviceId);
    if (!service) throw new ProError("Unknown service");
    if (body.status === "completed" && !canComplete(file))
      throw new ProError(
        "Export a reviewed final report before completing this case",
        409,
      );
    const allowed = new Set(checklist(service.kind).map((s) => s.id));
    if (body.checked.some((id) => !allowed.has(id)))
      throw new ProError("Unknown checklist step");
    const summary = `Case details saved · ${file.status} → ${body.status} · ${body.claim ? "assigned to owner" : "unassigned"} · service ${service.name}`;
    Object.assign(file, {
      status: body.status,
      assignedTo: body.claim ? ownerId : null,
      serviceId: service.id,
      question: body.question,
      notes: body.notes,
      checked: body.checked,
    });
    recordCaseStep(file, summary);
  } else if (body.action === "documentReading") {
    file.documentReading = body.reading;
    recordCaseStep(
      file,
      "Document positions/balance entered manually by astrologer (no OCR)",
    );
  } else if (body.action === "rectify") {
    if (body.state.transit?.active)
      throw new ProError(
        "Remove the transit overlay before locking a corrected natal time",
      );
    const original =
      file.rectification?.original ??
      caseStudioSchema.shape.input.parse(c.input);
    if (
      body.state.input.date !== c.input.date ||
      body.state.input.latitude !== c.input.latitude ||
      body.state.input.longitude !== c.input.longitude ||
      body.state.input.timezone !== c.input.timezone
    )
      throw new ProError(
        "Rectification changes time only; retain original date, coordinates and timezone",
      );
    file.rectification = {
      at: Date.now(),
      reason: body.reason,
      original,
      corrected: body.state.input,
    };
    file.state = body.state;
    recordCaseStep(
      file,
      `Analyst time hypothesis locked · original ${c.input.date} ${c.input.time} → ${body.state.input.date} ${body.state.input.time} (${body.state.input.timezone}) · ${body.reason}`,
    );
  } else if (body.action === "state") {
    if (body.state.comparisonId)
      ownedCase(db, ownerId, body.state.comparisonId);
    file.state = body.state;
    recordCaseStep(
      file,
      "Studio and tool state saved (paused civil-time snapshot)",
    );
  } else if (body.action === "pin") {
    if (body.state.comparisonId)
      ownedCase(db, ownerId, body.state.comparisonId);
    if (file.findings.length >= 10)
      throw new ProError("Maximum 10 pinned findings per case", 409);
    file.findings.push({
      id: newId(),
      title: body.title,
      text: body.text,
      state: body.state,
      at: Date.now(),
    });
    recordCaseStep(file, `Finding pinned · ${body.title}`);
  } else if (body.action === "removeDocument") {
    delete file.document;
    delete file.documentReading;
    recordCaseStep(file, "Document and manual reading deleted");
  } else if (body.action === "removePin") {
    if (!file.findings.some((f) => f.id === body.findingId))
      throw new ProError("Finding not found", 404);
    file.findings = file.findings.filter((f) => f.id !== body.findingId);
    recordCaseStep(
      file,
      "Finding unpinned; earlier report versions remain unchanged",
    );
  } else if (body.action === "report") {
    if (file.reports.length >= 8)
      throw new ProError("Maximum 8 immutable report versions per case", 409);
    if (body.stage === "final" && !body.reviewed)
      throw new ProError(
        "Review the report and confirm consent before creating a final version",
      );
    file.reports.push({
      id: newId(),
      version: file.reports.length + 1,
      stage: body.stage,
      language: body.language,
      title: body.title,
      body: body.body,
      findings: structuredClone(file.findings),
      branding: {
        displayName: account.displayName,
        qualifications: account.qualifications,
        contact: account.contact,
      },
      at: Date.now(),
    });
    recordCaseStep(
      file,
      `${body.stage} report version ${file.reports.length} created`,
    );
  }
  c.updatedAt = Date.now();
  return { client: c };
}
