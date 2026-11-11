import sharp from "sharp";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
export const DOCUMENT_MAX_BYTES = 2 * 1024 * 1024;
export const documentUploadSchema = z.object({
  mime: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  data: z
    .string()
    .max(Math.ceil(DOCUMENT_MAX_BYTES / 3) * 4)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
  consent: z.literal(true),
});
export type CaseDocument = {
  pages: string[];
  uploadedAt: number;
  sourceType: string;
  consentVersion: "pro-document-v1";
};
const exec = promisify(execFile);
function signature(data: Buffer, mime: string) {
  if (mime === "application/pdf")
    return data.subarray(0, 5).toString() === "%PDF-";
  if (mime === "image/png")
    return data
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/jpeg")
    return data[0] === 255 && data[1] === 216 && data[2] === 255;
  return (
    data.subarray(0, 4).toString() === "RIFF" &&
    data.subarray(8, 12).toString() === "WEBP"
  );
}
async function png(data: Buffer) {
  // Re-encoding drops EXIF/GPS, XMP, embedded profiles and all source metadata.
  return sharp(data, { limitInputPixels: 16000000, animated: false })
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
}
/** Only sanitized raster pages leave this boundary. Raw PDFs are never stored/served.
 * PDF parser subprocesses: 256MiB virtual memory, 8s wall deadline, max 4 pages,
 * fixed local filenames, no shell interpolation of client data. */
async function convertDocument(raw: unknown): Promise<CaseDocument> {
  const upload = documentUploadSchema.parse(raw),
    data = Buffer.from(upload.data, "base64");
  if (
    !data.length ||
    data.length > DOCUMENT_MAX_BYTES ||
    data.toString("base64") !== upload.data ||
    !signature(data, upload.mime)
  )
    throw new Error("Invalid document format or size");
  const pages: Buffer[] = [];
  if (upload.mime !== "application/pdf") pages.push(await png(data));
  else {
    const dir = await mkdtemp(path.join(tmpdir(), "pro-document-"));
    try {
      const file = path.join(dir, "source.pdf");
      await writeFile(file, data, { mode: 0o600 });
      const boundedExec = (bin: string, args: string[]) =>
        exec(
          "/bin/sh",
          ["-c", 'ulimit -v 262144; exec "$@"', "pdf-limit", bin, ...args],
          {
            timeout: 8000,
            killSignal: "SIGKILL",
            maxBuffer: 65536,
            encoding: "utf8",
            env: {
              PATH: process.env.PATH ?? "/usr/bin:/bin",
              HOME: dir,
              NODE_ENV: process.env.NODE_ENV,
            },
          },
        );
      const info = await boundedExec("pdfinfo", [file]);
      const count = Number(info.stdout.match(/^Pages:\s+(\d+)$/m)?.[1]);
      if (
        !Number.isInteger(count) ||
        count < 1 ||
        count > 4 ||
        /^Encrypted:\s+yes/m.test(info.stdout)
      )
        throw new Error("Only unencrypted PDFs with 1–4 pages are accepted");
      await boundedExec("pdftoppm", [
        "-f",
        "1",
        "-l",
        String(count),
        "-scale-to",
        "1600",
        "-png",
        file,
        path.join(dir, "page"),
      ]);
      for (const name of (await readdir(dir))
        .filter((n) => /^page(?:-\d+)?\.png$/.test(n))
        .sort())
        pages.push(await png(await readFile(path.join(dir, name))));
      if (pages.length !== count) throw new Error("Incomplete PDF conversion");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
  if (pages.reduce((n, p) => n + p.length, 0) > 1500000)
    throw new Error("Sanitized document too large");
  return {
    pages: pages.map((p) => p.toString("base64")),
    sourceType: upload.mime,
    uploadedAt: Date.now(),
    consentVersion: "pro-document-v1",
  };
}

// Bound native decoder concurrency per app process; never queue arbitrary uploads.
let converting = false;
export async function sanitizeDocument(raw: unknown): Promise<CaseDocument> {
  if (converting) throw new Error("Document converter busy; retry shortly");
  converting = true;
  try {
    return await convertDocument(raw);
  } finally {
    converting = false;
  }
}
