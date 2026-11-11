import { z } from "zod";
export const chartMetadataSchema = z.object({
  label: z.string().trim().min(1).max(100),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10)
    .refine((v) => new Set(v).size === v.length),
  notes: z.string().max(6000),
});
export type ClientSummary = {
  id: string;
  createdAt: number;
  lagna: string;
  label: string;
  tags: string[];
  notes: string;
};
export function filterClientRecords<T extends ClientSummary>(
  clients: T[],
  query: string,
) {
  const words = query
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return clients
    .filter((c) =>
      words.every((w) =>
        `${c.label} ${c.tags.join(" ")} ${c.notes} ${c.lagna}`
          .normalize("NFC")
          .toLocaleLowerCase()
          .includes(w),
      ),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}
