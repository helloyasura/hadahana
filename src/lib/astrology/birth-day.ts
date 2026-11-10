import { computeDetailedPanchang } from "vpv-panchangam";

type Panchang = Awaited<ReturnType<typeof computeDetailedPanchang>>;
export function shiftCivilDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function civilWeekday(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Civil date stays unchanged; vara and ishta use the last actual local sunrise.
 * Birth limbs use the containing transition interval, never yesterday's sunrise limb.
 */
export async function birthDay(date: string, birthIso: string, latitude: number,
  longitude: number, timezone: string, today?: Panchang) {
  today ??= await computeDetailedPanchang(date, latitude, longitude, timezone, "en");
  const sunrise = (today.sun_moon as { sunrise?: string }).sunrise;
  const beforeSunrise = !!sunrise && Date.parse(birthIso) < Date.parse(sunrise);
  const vedicDate = beforeSunrise ? shiftCivilDate(date, -1) : date;
  const active = beforeSunrise
    ? await computeDetailedPanchang(vedicDate, latitude, longitude, timezone, "en") : today;
  const pan = { ...active.panchang } as Record<string, unknown>;
  type Limb = { index: number; name: string; starts_at: string; ends_at: string };
  const t = Date.parse(birthIso);
  for (const key of ["tithi", "nakshatra", "yoga", "karana"]) {
    const seq = pan[`${key}_sequence`] as Limb[] | undefined;
    const limb = seq?.find(s => Date.parse(s.starts_at) <= t && t < Date.parse(s.ends_at));
    if (limb) {
      // Sequences are clipped at next sunrise. Extend the end from today's
      // first interval when the same limb continues across that boundary.
      const next = (today.panchang as Record<string, unknown>)[key] as Limb | undefined;
      pan[key] = beforeSunrise && next?.name === limb.name && Date.parse(next.ends_at) > Date.parse(limb.ends_at)
        ? { ...limb, ends_at: next.ends_at } : limb;
    }
  }
  const tithi = pan.tithi as Limb | undefined;
  if (tithi) pan.paksha = tithi.index > 15 ? "Krishna Paksha" : "Shukla Paksha";
  return { beforeSunrise, vedicDate, weekday: civilWeekday(vedicDate),
    sunrise: (active.sun_moon as { sunrise?: string }).sunrise,
    panchang: pan, hora: active.hora };
}
