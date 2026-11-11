import { z } from "zod";
import {
  authenticatedOwner,
  failure,
  jsonBody,
  requireLicense,
  response,
} from "@/lib/pro/http";
import { transaction, consumeRate, ProError } from "@/lib/pro/store";
import { ownedCase } from "@/lib/pro/case-actions";
import { documentUploadSchema, sanitizeDocument } from "@/lib/pro/document";
import { recordCaseStep } from "@/lib/pro/cases";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const owner = await authenticatedOwner();
    await requireLicense(owner.subject);
    if (
      !(await transaction((db) =>
        consumeRate(db, "case-document", owner.id, 6, 600),
      ))
    )
      throw new ProError("Document upload limit reached", 429);
    const body = z
      .object({
        id: z.uuid(),
        revision: z.number().int().nonnegative(),
        upload: documentUploadSchema,
      })
      .parse(await jsonBody(req, 3 * 1024 * 1024));
    await transaction((db) => {
      if (ownedCase(db, owner.id, body.id).case.revision !== body.revision)
        throw new ProError("Case changed. Reload before uploading.", 409);
    });
    let document: Awaited<ReturnType<typeof sanitizeDocument>>;
    try {
      document = await sanitizeDocument(body.upload);
    } catch {
      throw new ProError(
        "Use a JPEG/PNG/WebP image or unencrypted 1–4-page PDF, at most 2MB. Conversion failed or exceeded safe limits.",
      );
    }
    return response(
      await transaction((db) => {
        const client = ownedCase(db, owner.id, body.id);
        if (client.case.revision !== body.revision)
          throw new ProError("Case changed. Reload before uploading.", 409);
        client.case.document = document;
        delete client.case.documentReading;
        recordCaseStep(
          client.case,
          "Consented document uploaded/replaced; EXIF stripped; raster pages only",
        );
        return { client };
      }),
    );
  } catch (e) {
    return failure(e);
  }
}
