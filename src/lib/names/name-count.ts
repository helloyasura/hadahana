/** Practical bounds shared by API + Name Studio UI (any integer in range). */
export const NAME_COUNT_MIN = 1;
export const NAME_COUNT_MAX = 200;
export const NAME_COUNT_DEFAULT = 20;

export function clampNameCount(raw: unknown): number {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseInt(raw, 10)
        : NAME_COUNT_DEFAULT;
  if (!Number.isFinite(n)) return NAME_COUNT_DEFAULT;
  return Math.min(NAME_COUNT_MAX, Math.max(NAME_COUNT_MIN, Math.floor(n)));
}
