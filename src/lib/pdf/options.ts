export const PDF_SIZES = ["A4", "A5", "Letter", "Legal"] as const;
export type PdfSize = typeof PDF_SIZES[number];
export type PdfOrientation = "portrait" | "landscape";
export function pdfOptions(params: URLSearchParams) {
  const size = params.get("size") || "A4";
  const orientation = params.get("orientation") || "portrait";
  if (!PDF_SIZES.includes(size as PdfSize) || !["portrait", "landscape"].includes(orientation)) throw new Error("Invalid paper size or orientation");
  return { size: size as PdfSize, orientation: orientation as PdfOrientation };
}
