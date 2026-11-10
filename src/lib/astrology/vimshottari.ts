/** Solar-year convention. Keep dates at full precision; round only display. */
export const DASHA_YEAR_DAYS = 365.25;
const MS_DAY = 86400000;
const LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];
export function splitDashaYears(years: number, yearDays = DASHA_YEAR_DAYS) {
  if (!Number.isFinite(years) || years < 0) throw new Error("Invalid dasha duration");
  // Round once, then decompose; carry a rounded final day into month/year.
  const monthsTotal = Math.floor(years * 12 + 1e-10);
  const monthDays = yearDays / 12;
  let months = monthsTotal;
  let d = Math.round((years * 12 - monthsTotal) * monthDays);
  if (d >= monthDays) { months++; d = 0; }
  return { y: Math.floor(months / 12), m: months % 12, d };
}
export function vimshottari(moonLongitude: number, birthIso: string, yearDays = DASHA_YEAR_DAYS) {
  const norm = ((moonLongitude % 360) + 360) % 360;
  const span = 360 / 27;
  const nakIndex = Math.floor(norm / span);
  const elapsedFraction = (norm - nakIndex * span) / span;
  const firstIndex = nakIndex % 9;
  const balanceYears = (1 - elapsedFraction) * YEARS[firstIndex];
  const birth = Date.parse(birthIso);
  if (![360, 365.25].includes(yearDays)) throw new Error("Unsupported dasa year");
  const yearMs = yearDays * MS_DAY;
  let start = birth;
  const maha = Array.from({ length: 9 }, (_, i) => {
    const idx = (firstIndex + i) % 9;
    const years = i === 0 ? balanceYears : YEARS[idx];
    const end = start + years * yearMs;
    const row = { lord: LORDS[idx], start: new Date(start).toISOString(), end: new Date(end).toISOString(), years };
    start = end;
    return row;
  });
  // Do not compress all nine antardashas into the remaining mahadasha!
  // Anchor the full first mahadasha before birth, then clip elapsed periods.
  const fullStart = birth - elapsedFraction * YEARS[firstIndex] * yearMs;
  let cursor = fullStart;
  const antar = Array.from({ length: 9 }, (_, i) => {
    const idx = (firstIndex + i) % 9;
    const end = i === 8 ? Date.parse(maha[0].end) : cursor + YEARS[firstIndex] * YEARS[idx] / 120 * yearMs;
    const clipped = Math.max(cursor, birth);
    const row = { lord: LORDS[idx], start: new Date(clipped).toISOString(), end: new Date(end).toISOString(), years: (end - clipped) / yearMs };
    cursor = end;
    return row;
  }).filter(d => Date.parse(d.end) > birth);
  return { maha, antar, balanceYears, elapsedFraction, yearDays };
}
