/** Vimshottari proportions: BPHS Dasha of Planets; same year convention as the existing engine.
 * Subperiods are always anchored to the FULL parent, never to its birth-clipped remainder.
 */
export const DASHA_LORDS = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
] as const;
export const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17] as const;
export type DashaPeriod = {
  lord: string;
  fullStart: number;
  start: number;
  end: number;
  children: DashaPeriod[];
};
export function dashaTree(
  moonLongitude: number,
  birthIso: string,
  yearDays: 360 | 365.25,
): DashaPeriod[] {
  const birth = Date.parse(birthIso);
  if (
    !Number.isFinite(birth) ||
    !Number.isFinite(moonLongitude) ||
    ![360, 365.25].includes(yearDays)
  )
    throw new Error("Invalid dasha input");
  const lon = ((moonLongitude % 360) + 360) % 360,
    nak = lon / (360 / 27),
    first = Math.floor(nak) % 9;
  const yearMs = yearDays * 86400000;
  let cursor = birth - (nak - Math.floor(nak)) * DASHA_YEARS[first] * yearMs;
  function split(
    start: number,
    end: number,
    firstIndex: number,
    depth: number,
  ): DashaPeriod[] {
    let next = start;
    return Array.from({ length: 9 }, (_, i) => {
      const index = (firstIndex + i) % 9,
        fullStart = next;
      next =
        i === 8 ? end : fullStart + ((end - start) * DASHA_YEARS[index]) / 120;
      return {
        lord: DASHA_LORDS[index],
        fullStart,
        start: Math.max(fullStart, birth),
        end: next,
        children: depth > 1 ? split(fullStart, next, index, depth - 1) : [],
      };
    }).filter((p) => p.end > birth);
  }
  return Array.from({ length: 9 }, (_, i) => {
    const index = (first + i) % 9,
      fullStart = cursor;
    cursor += DASHA_YEARS[index] * yearMs;
    return {
      lord: DASHA_LORDS[index],
      fullStart,
      start: Math.max(fullStart, birth),
      end: cursor,
      children: split(fullStart, cursor, index, 2),
    };
  });
}
/** Half-open intervals make exact boundary jumps deterministic. */
export function periodPath(
  tree: DashaPeriod[],
  instant: number,
): DashaPeriod[] {
  const period = tree.find((p) => instant >= p.start && instant < p.end);
  return period ? [period, ...periodPath(period.children, instant)] : [];
}
