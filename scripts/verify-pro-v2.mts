import assert from "node:assert/strict";
import {
  dashaTree,
  periodPath,
  DASHA_YEARS,
  DASHA_LORDS,
} from "../src/lib/pro/dasha";
import { vimshottari } from "../src/lib/astrology/vimshottari";
import { divisionalLongitude } from "../src/lib/pro/studio";
for (const year of [360, 365.25] as const)
  for (const lon of [0, 4.5, 13.3333333334, 99.123456789, 359.99999999]) {
    const birth = "2000-01-01T06:30:00.000Z",
      tree = dashaTree(lon, birth, year),
      legacy = vimshottari(lon, birth, year);
    assert.ok(Math.abs(tree[0].end - Date.parse(legacy.maha[0].end)) < 2);
    const check = (periods: typeof tree) => {
      for (const p of periods) {
        assert.ok(p.end > p.start);
        assert.ok(p.start >= Date.parse(birth));
        if (p.children.length) {
          assert.equal(p.children[0].start, p.start);
          assert.equal(p.children.at(-1)!.end, p.end);
          for (let i = 1; i < p.children.length; i++)
            assert.equal(p.children[i - 1].end, p.children[i].start);
          check(p.children);
        }
      }
    };
    check(tree);
    for (const p of tree) {
      assert.equal(periodPath(tree, p.start)[0], p);
      assert.notEqual(periodPath(tree, p.end)[0], p);
    }
    assert.equal(periodPath(tree, Date.parse(birth) - 1).length, 0);
    assert.equal(periodPath(tree, Date.parse(birth)).length, 3);
  }
const exact = dashaTree(0, "2000-01-01T00:00:00Z", 360);
assert.equal(exact[0].lord, "Ketu");
assert.equal((exact[0].end - exact[0].start) / 86400000, 7 * 360);
assert.ok(
  Math.abs(
    (exact[0].children[0].end - exact[0].children[0].start) / 86400000 -
      ((7 * 7) / 120) * 360,
  ) < 1e-8,
);
assert.ok(
  Math.abs(
    (exact[0].children[0].children[0].end -
      exact[0].children[0].children[0].start) /
      86400000 -
      ((7 * 7 * 7) / 120 / 120) * 360,
  ) < 1e-8,
);
assert.equal(
  DASHA_YEARS.reduce((s, y) => s + y, 0),
  120,
);
assert.equal(new Set(DASHA_LORDS).size, 9);
assert.equal(divisionalLongitude(30 / 9, 9), 30);
assert.ok(
  Math.abs(divisionalLongitude(123.123456789, 9) - 28.111111101) < 1e-9,
);
console.log(
  "Pro v2: hierarchical dasha anchoring, clipping, boundaries, proportional durations, both year conventions and full-precision D9 passed.",
);

const { findIngress, ephemerisSampler, skyAt } = await import(
  "../src/lib/pro/transits"
);
const { DEFAULT_CALCULATION_CONFIG } = await import(
  "../src/lib/astrology/config"
);
const hour = 3600000;
const direct = (t: number) => ({
  longitude: (((359 + t / hour) % 360) + 360) % 360,
  speed: 24,
});
assert.equal(findIngress(direct, 0, 2 * hour, 0)!.toSign, 0);
assert.ok(Date.parse(findIngress(direct, 0, 2 * hour, 0)!.instant) >= hour);
const retro = (t: number) => ({
  longitude: (((31 - t / hour) % 360) + 360) % 360,
  speed: -24,
});
assert.equal(findIngress(retro, 0, 2 * hour, 0)!.retrograde, true);
assert.equal(findIngress(direct, 0, hour / 2, 2), null);
assert.throws(() => findIngress(direct, 0, 367 * 86400000, 0));
const sampler = await ephemerisSampler(
  { ...DEFAULT_CALCULATION_CONFIG },
  "Sun",
);
const from = Date.parse("2000-01-01T00:00:00Z"),
  entry = findIngress(sampler, from, from + 40 * 86400000, 9)!;
assert.ok(entry);
const t = Date.parse(entry.instant);
assert.equal(Math.floor(sampler(t + 2000).longitude / 30), 9);
assert.notEqual(Math.floor(sampler(t - 2000).longitude / 30), 9);
const sky = await skyAt(from, { ...DEFAULT_CALCULATION_CONFIG });
assert.equal(sky.length, 9);
assert.ok(
  Math.abs(
    Math.abs(
      sky.find((p) => p.name === "Rahu")!.longitude -
        sky.find((p) => p.name === "Ketu")!.longitude,
    ) - 180,
  ) < 1e-9,
);
console.log(
  "Transit solver: forward/wrap/retrograde brackets, range bounds, real-engine ingress bracket and node opposition passed.",
);

const { getPanchanga } = await import("../src/lib/astrology/panchanga");
const { EphemerisService } = await import("vpv-panchangam");
const { matchPorondam } = await import("../src/lib/astrology/porondam");
const { scanEventDates } = await import("../src/lib/astrology/event-nakath");
const { studioBirthSchema } = await import("../src/lib/pro/input");
const input = {
  date: "2000-01-01",
  time: "12:00",
  latitude: 6.9271,
  longitude: 79.8612,
  timezone: "Asia/Colombo",
};
const pan = await getPanchanga(input);
EphemerisService.getInstance().setAyanamsa("raman");
assert.deepEqual(
  await getPanchanga(input),
  pan,
  "Panchanga must not inherit another chart's ayanamsa",
);
assert.ok(pan.inauspiciousLocal.rahuKalaya?.start);
assert.equal(pan.timezone, input.timezone);
assert.equal(
  studioBirthSchema.safeParse({ ...input, date: "2000-02-31" }).success,
  false,
);
assert.equal(
  studioBirthSchema.safeParse({ ...input, time: "25:00" }).success,
  false,
);
const match = await matchPorondam(input, { ...input, date: "2001-02-02" });
assert.equal(match.points.length, 10);
assert.ok(match.notes.some((n) => n.includes("screening")));
const days = await scanEventDates({
  birth: input,
  eventId: "naming",
  fromDate: "2000-01-01",
  toDate: "2000-01-03",
  limit: 31,
});
assert.equal(days.scannedDays, 3);
assert.ok(days.dates.length > 0 && days.dates.length <= 3);
assert.ok(
  days.dates.every((d) => d.date >= "2000-01-01" && d.date <= "2000-01-03"),
);
console.log(
  "Consultation engines: almanac state isolation, civil validation, inherited matching warnings and bounded nakath shortlist passed.",
);

const { chartMetadataSchema, filterClientRecords } = await import(
  "../src/lib/pro/chart-metadata"
);
assert.equal(
  chartMetadataSchema.safeParse({
    label: "A",
    tags: ["same", "same"],
    notes: "",
  }).success,
  false,
);
assert.equal(
  chartMetadataSchema.safeParse({
    label: "A",
    tags: [],
    notes: "x".repeat(6001),
  }).success,
  false,
);
const archive = [
  {
    id: "a",
    createdAt: 1,
    lagna: "මේෂ",
    label: "Alpha",
    tags: ["vedic"],
    notes: "private family",
  },
  {
    id: "b",
    createdAt: 2,
    lagna: "Cancer",
    label: "Beta",
    tags: ["work"],
    notes: "",
  },
];
assert.deepEqual(
  filterClientRecords(archive, "").map((c) => c.id),
  ["b", "a"],
);
assert.equal(filterClientRecords(archive, "ALPHA vedic මේෂ")[0].id, "a");
assert.equal(filterClientRecords(archive, "family").length, 1);
assert.equal(filterClientRecords(archive, "unknown").length, 0);
console.log(
  "Client archive: metadata bounds/unique tags, Sinhala/English multi-term search and stable newest-first order passed.",
);
