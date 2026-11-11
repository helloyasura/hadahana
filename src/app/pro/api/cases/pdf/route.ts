import { z } from "zod";
import { AccountError } from "@/lib/account/server";
import { NextResponse } from "next/server";
import {
  authenticatedOwner,
  failure,
  jsonBody,
  privateHeaders,
} from "@/lib/pro/http";
import { transaction, ProError } from "@/lib/pro/store";
import { ownedCase } from "@/lib/pro/case-actions";
import { recordCaseStep } from "@/lib/pro/cases";
import { renderPdf, admitPdf } from "@/lib/pdf/renderer";
import { caseReportHtml } from "@/lib/pdf/case-template";
export const runtime = "nodejs";
const schema = z.object({
  id: z.uuid(),
  reportId: z.uuid(),
  issue: z.boolean(),
});
export async function POST(req: Request) {
  try {
    const owner = await authenticatedOwner(),
      body = schema.parse(await jsonBody(req));
    const report = await transaction((db) => {
      const r = ownedCase(db, owner.id, body.id).case.reports.find(
        (r) => r.id === body.reportId,
      );
      if (!r) throw new ProError("Report not found", 404);
      if (body.issue && r.stage !== "final")
        throw new ProError("Only a reviewed final report can be issued", 409);
      return structuredClone(r);
    });
    admitPdf(`pro-case:${owner.id}`);
    const pdf = await renderPdf(caseReportHtml(report));
    // Recheck after rendering: never issue/export a concurrently deleted client.
    await transaction((db) => {
      const c = ownedCase(db, owner.id, body.id),
        r = c.case.reports.find((r) => r.id === body.reportId);
      if (!r) throw new ProError("Report not found", 404);
      if (body.issue && !r.issuedAt) {
        r.issuedAt = Date.now();
        recordCaseStep(
          c.case,
          `Final report v${r.version} exported to astrologer; customer delivery not confirmed`,
        );
      }
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="hadahana-case-v${report.version}-${report.stage}.pdf"`,
      },
    });
  } catch (e) {
    return failure(e instanceof AccountError ? new ProError(e.message, e.status) : e);
  }
}
