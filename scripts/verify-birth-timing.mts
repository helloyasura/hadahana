import assert from "node:assert/strict";
import { buildSatahana } from "../src/lib/astrology/satahana";
import { castKendraya } from "../src/lib/astrology/kendraya";
import { birthDay, shiftCivilDate } from "../src/lib/astrology/birth-day";
import { formatIshta } from "../src/lib/astrology/booklet-fields";
import { vimshottari, splitDashaYears } from "../src/lib/astrology/vimshottari";
import { computeChart, computeDetailedPanchang } from "vpv-panchangam";

// Anonymous regression fixture; no customer identity is stored.
const input = { date: "2026-11-04", time: "05:46", latitude: 7.2744,
  longitude: 80.6115, timezone: "Asia/Colombo", ayanamsa: "lahiri" as const };
const chart = await buildSatahana(input);
const raw = await computeChart(input, "en");
const moon = raw.planets_data.find(p => p.name === "Moon")!;
const d = vimshottari(moon.longitude, raw.birth.utc_time);
assert(Math.abs(moon.longitude - 134.62870474152317) < 0.00001);
assert(Math.abs(d.elapsedFraction - 0.0971528556142367) < 1e-10);
assert.deepEqual(chart.booklet.ishta, { hours: "23", minutes: "50", seconds: "30" });
assert.equal(chart.booklet.vedicDate, "2026-11-03");
assert.equal(chart.meta.weekdayEn, "Wednesday");
assert.equal(chart.meta.vedicWeekdayEn, "Tuesday");
assert.equal(chart.booklet.birthNarrative.weekdaySi, "බදාදා");
assert.equal(chart.booklet.weekdayShortSi, "කුජ");
assert.equal(chart.meta.tithiEn, "Dashami");
assert.equal(chart.meta.yoga, "Brahma");
assert.equal(chart.meta.karanaEn, "Vishti");
assert.equal(chart.meta.nekathaEn, "Purva Phalguni");
assert.equal(chart.meta.pada, 1);
assert.equal(chart.meta.hora, "ශුක්‍ර");
// 00 months is correct for this longitude, NOT a truncation bug.
assert.deepEqual(splitDashaYears(d.balanceYears), { y: 18, m: 0, d: 21 });
assert.deepEqual(splitDashaYears(d.balanceYears, 360), { y: 18, m: 0, d: 20 });
assert.deepEqual(chart.booklet.dashaBalance, { lordSi: "ශුක්‍ර", years: 18, months: 0, days: 21 });
assert.equal(chart.rashiChart.centerTitleEn, "Libra Lagna");
const lagna = chart.grahaTable.find(p => p.name === "Lagna")!;
assert(Math.abs(lagna.longitude - (194 + 9 / 60 + 20 / 3600)) < 0.002);
// Both public chart surfaces must use identical full-precision boundaries.
const kendraya = await castKendraya(input);
assert.equal(kendraya.vimshottari.balanceAtBirth.endUtc, chart.mahaDasha[0].end);
assert.equal(kendraya.namThebima.letterSet.weekdayIndex, 2);
assert.equal(kendraya.vimshottari.currentAntardashaAtBirth?.endUtc, chart.antarDasha[0].end);
assert.equal(chart.antarDasha[0].lord, "Venus");
// Venus/Venus total is 20*20/120 years from the true pre-birth MD start.
const fullStart = Date.parse(raw.birth.utc_time) - d.elapsedFraction * 20 * 365.25 * 86400000;
assert(Math.abs(Date.parse(chart.antarDasha[0].end) - (fullStart + 20 * 20 / 120 * 365.25 * 86400000)) < 2);
assert.equal(chart.antarDasha.at(-1)!.end, chart.mahaDasha[0].end);
for (let i = 1; i < chart.mahaDasha.length; i++) assert.equal(chart.mahaDasha[i].start, chart.mahaDasha[i - 1].end);
for (let i = 1; i < chart.antarDasha.length; i++) assert.equal(chart.antarDasha[i].start, chart.antarDasha[i - 1].end);
// Synthetic nonzero-month case catches actual month truncation/rounding regressions.
assert.deepEqual(splitDashaYears(18 + 8 / 12 + 21 / 365.25), { y: 18, m: 8, d: 21 });
assert.deepEqual(splitDashaYears(18 + (11 * 30.4375 + 31) / 365.25), { y: 19, m: 0, d: 1 });
assert.throws(() => splitDashaYears(-1));
assert(Math.abs(vimshottari(133.33333333333334, raw.birth.utc_time).balanceYears - 20) < 1e-10);
const nearEnd = vimshottari(146.6, raw.birth.utc_time);
assert(nearEnd.antar.length < 9); // elapsed antardashas must be removed
assert.equal(nearEnd.antar[0].lord, "Ketu");
assert.equal(nearEnd.antar.at(-1)!.end, nearEnd.maha[0].end);
const today = await computeDetailedPanchang(input.date, input.latitude, input.longitude, input.timezone, "en");
const sunrise = (today.sun_moon as { sunrise: string }).sunrise;
for (const [iso, expectedDay, expectedDate] of [
  [new Date(Date.parse(sunrise) - 1).toISOString(), 2, "2026-11-03"],
  [sunrise, 3, "2026-11-04"],
  [new Date(Date.parse(sunrise) + 1000).toISOString(), 3, "2026-11-04"],
  ["2026-11-03T18:29:00Z", 2, "2026-11-03"], // 23:59 Colombo
  ["2026-11-03T18:31:00Z", 2, "2026-11-03"], // 00:01 Colombo
] as const) {
  const date = iso === "2026-11-03T18:29:00Z" ? "2026-11-03" : input.date;
  const result = await birthDay(date, iso, input.latitude, input.longitude, input.timezone,
    date === input.date ? today : undefined);
  assert.equal(result.weekday, expectedDay);
  assert.equal(result.vedicDate, expectedDate);
  const elapsed = Date.parse(iso) - Date.parse(result.sunrise!);
  assert(elapsed >= 0 && elapsed < 86460000);
}
assert.deepEqual(formatIshta(sunrise, sunrise), { hours: "00", minutes: "00", seconds: "00" });
assert.deepEqual(formatIshta(sunrise, new Date(Date.parse(sunrise) + 1000).toISOString()), { hours: "00", minutes: "00", seconds: "01" });
assert.equal(formatIshta(sunrise, "2026-11-04T00:16:00Z").hours, "—"); // future reference is not zero
assert.equal(formatIshta(undefined, raw.birth.utc_time).hours, "—");
assert.equal(shiftCivilDate("2027-01-01", -1), "2026-12-31");
assert.equal(shiftCivilDate("2024-03-01", -1), "2024-02-29");
console.log(JSON.stringify({ moonLongitude: moon.longitude, elapsedFraction: d.elapsedFraction,
  balanceYears: d.balanceYears, solar: splitDashaYears(d.balanceYears), savana: splitDashaYears(d.balanceYears, 360),
  ishta: chart.booklet.ishta, mahaEnd: chart.mahaDasha[0].end, antarEnd: chart.antarDasha[0].end }));
console.log("Birth timing regression tests passed");
