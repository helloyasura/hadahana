import assert from "node:assert/strict";
import {
  BODIES,
  divisionalLongitude,
  normalizeLongitude,
  positionInfo,
  studioHouse,
  studioSettingsSchema,
  aspectBetween,
  type StudioBody,
} from "../src/lib/pro/studio";
import { RASHI } from "../src/lib/astrology/sinhala-names";
import { DEFAULT_CALCULATION_CONFIG } from "../src/lib/astrology/config";
import { castKendraya } from "../src/lib/astrology/kendraya";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { transaction, newId } from "../src/lib/pro/store";
const legacy = studioSettingsSchema.parse({});
assert.deepEqual(legacy.calculation, DEFAULT_CALCULATION_CONFIG);
assert.deepEqual(legacy.bodies, BODIES);
assert.equal(normalizeLongitude(-1), 359);
assert.equal(normalizeLongitude(720), 0);
assert.equal(divisionalLongitude(30, 9), 270);
assert.equal(divisionalLongitude(120, 9), 0);
assert.equal(divisionalLongitude(359.999, 9).toFixed(3), "359.991");
assert.equal(positionInfo(0).pada, 1);
assert.equal(positionInfo(360).nakshatra, 0);
assert.equal(positionInfo(359.999).pada, 4);
assert.equal(positionInfo(360 / 27).nakshatra, 1);
assert.equal(positionInfo(10).pada, 4);
assert.equal(studioHouse(35, 39, "whole-sign"), 1);
assert.equal(studioHouse(35, 39, "equal"), 12);
assert.equal(studioHouse(0, 350, "equal"), 1);
assert.equal(studioHouse(350, 350, "equal"), 1);
assert.equal(studioHouse(20, 350, "equal"), 2);
assert.equal(studioSettingsSchema.safeParse({ orb: -1 }).success, false);
assert.equal(studioSettingsSchema.safeParse({ orb: 16 }).success, false);
assert.equal(
  studioSettingsSchema.safeParse({ bodies: ["Sun", "Sun"] }).success,
  false,
);
assert.equal(studioSettingsSchema.safeParse({ division: 7 }).success, false);
assert.equal(
  studioSettingsSchema.safeParse({ notes: "a".repeat(6001) }).success,
  false,
);
const body = (name: string, longitude: number): StudioBody => ({
  name,
  longitude,
  label: name,
  retrograde: false,
  dignity: "",
});
assert.equal(
  aspectBetween(body("Mars", 1), body("Sun", 91), "parashari", 0),
  true,
);
assert.equal(
  aspectBetween(body("Sun", 91), body("Mars", 1), "parashari", 15),
  false,
);
assert.equal(
  aspectBetween(body("Jupiter", 2), body("Moon", 128), "parashari", 0),
  true,
);
assert.equal(
  aspectBetween(body("Saturn", 5), body("Sun", 272), "parashari", 0),
  true,
);
assert.equal(
  aspectBetween(body("Rahu", 1), body("Sun", 181), "parashari", 6),
  false,
);
assert.equal(
  aspectBetween(body("Sun", 359), body("Moon", 1), "degree", 2),
  true,
);
assert.equal(
  aspectBetween(body("Sun", 0), body("Moon", 95), "degree", 4),
  false,
);
assert.equal(
  aspectBetween(body("Sun", 0), body("Moon", 95), "degree", 5),
  true,
);
assert.equal(
  aspectBetween(body("Sun", 0), body("Moon", 180), "none", 15),
  false,
);
const synthetic = {
  date: "2000-01-01",
  time: "12:00",
  latitude: 6.9271,
  longitude: 79.8612,
  timezone: "Asia/Colombo",
};
const chart = await castKendraya(synthetic);
assert.equal(chart.navagraha.length, 9);
for (const p of chart.navagraha) {
  assert.ok(p.longitude >= 0 && p.longitude < 360);
  assert.equal(
    studioHouse(p.longitude, chart.lagna.longitude, "whole-sign"),
    p.bhava,
  );
  assert.equal(positionInfo(p.longitude).pada, p.pada);
}
assert.equal(
  Object.keys(RASHI)[
    Math.floor(divisionalLongitude(chart.lagna.longitude, 9) / 30)
  ],
  chart.varga.d9Asc,
);
const configured = await castKendraya(synthetic, {
  ...DEFAULT_CALCULATION_CONFIG,
  ayanamsa: "raman",
  nodes: "true",
  dasaYearDays: 360,
});
assert.notEqual(
  chart.navagraha[0].longitude,
  configured.navagraha[0].longitude,
);
assert.notEqual(
  chart.navagraha.find((p) => p.graha === "Rahu")!.longitude,
  configured.navagraha.find((p) => p.graha === "Rahu")!.longitude,
);
assert.equal(configured.vimshottari.convention.yearDays, 360);
const dir = await mkdtemp(path.join(tmpdir(), "studio-unit-"));
const oldPath = process.env.PRO_DATA_PATH,
  oldKey = process.env.PRO_STORAGE_KEY;
process.env.PRO_DATA_PATH = path.join(dir, "store.enc");
process.env.PRO_STORAGE_KEY =
  "synthetic-studio-unit-key-at-least-32-characters";
try {
  const id = newId();
  await transaction((db) => {
    db.accounts.push({
      id,
      subject: "synthetic",
      email: "synthetic@example.test",
      displayName: "Synthetic",
      qualifications: "",
      contact: "",
      logo: "",
      createdAt: Date.now(),
    });
    db.presets.push({
      id: newId(),
      ownerId: id,
      name: "Legacy",
      version: 1,
      config: { ...DEFAULT_CALCULATION_CONFIG, ayanamsa: "raman" },
      createdAt: Date.now(),
    });
  });
  await transaction((db) => {
    assert.deepEqual(db.accounts[0].studio, legacy);
    assert.equal(db.presets[0].config.ayanamsa, "raman");
    assert.equal(db.presets[0].studio, undefined);
    db.accounts[0].studio = {
      ...legacy,
      notes: "Private manual rules",
      division: 9,
    };
  });
  await transaction((db) => {
    assert.equal(db.accounts[0].studio!.division, 9);
    assert.equal(db.accounts[0].studio!.notes, "Private manual rules");
  });
} finally {
  if (oldPath === undefined) delete process.env.PRO_DATA_PATH;
  else process.env.PRO_DATA_PATH = oldPath;
  if (oldKey === undefined) delete process.env.PRO_STORAGE_KEY;
  else process.env.PRO_STORAGE_KEY = oldKey;
  await rm(dir, { recursive: true, force: true });
}
console.log(
  "Pro studio passed: schema/default migration, D9, nakshatra/padas, whole/equal houses, directed drishti, orb boundaries, configured engine, encrypted persistence.",
);
