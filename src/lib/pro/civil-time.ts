import { ProError } from "./store";
/** The inherited engine resolves civil clocks itself. Reject skipped/repeated local
 * clock readings in the public pilot rather than guessing at a historical instant.
 * Covers nearby 15/30/60/120-minute transitions (including Colombo 1996/2006).
 */
export function validateResolvedCivilTime(
  date: string,
  time: string,
  zone: string,
  resolvedIso: string,
) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const expected = `${date}T${time}`;
  const representation = (ms: number) => {
    const p = Object.fromEntries(
      formatter.formatToParts(ms).map((p) => [p.type, p.value]),
    );
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  };
  const ms = Date.parse(resolvedIso);
  if (representation(ms) !== expected)
    throw new ProError(
      "මෙම පැරණි ඔරලෝසු වේලාව කාල කලාප මාරුවක් නිසා නොපවතී. ජෝතිෂ්‍යවේදියා සමඟ තහවුරු කරන්න.",
      422,
    );
  for (let minutes = -180; minutes <= 180; minutes += 15) {
    if (minutes && representation(ms + minutes * 60000) === expected)
      throw new ProError(
        "මෙම පැරණි ඔරලෝසු වේලාව දෙවරක් පැවතුණි. නිවැරදි අවස්ථාව ජෝතිෂ්‍යවේදියා සමඟ තහවුරු කරන්න.",
        422,
      );
  }
}
