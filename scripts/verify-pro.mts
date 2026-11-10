import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { castKendraya } from "../src/lib/astrology/kendraya";
import {
  DEFAULT_CALCULATION_CONFIG as defaults,
  calculationConfigSchema,
} from "../src/lib/astrology/config";
import { configuredBirthSunrise } from "../src/lib/astrology/configured-positions";
import { validateResolvedCivilTime } from "../src/lib/pro/civil-time";
import {
  consumeRate,
  digest,
  newId,
  opaqueToken,
  transaction,
  usableLink,
} from "../src/lib/pro/store";
import { proLums } from "../src/lib/pro/lums";
import { z } from "zod";
const birth = { date: "2001-07-12", time: "10:30", placeId: "colombo" };
const original = await castKendraya(birth);
assert.equal(
  createHash("sha256").update(JSON.stringify(original)).digest("hex"),
  "bfc5e2ccb11477752b1b5f714f3a29ef51bc04aa8870ed6ae2d380c9378d9693",
  "pre-refactor consumer synthetic fixture must remain byte-identical",
);
assert.deepEqual(await castKendraya(birth, { ...defaults }), original);
const raman = await castKendraya(birth, { ...defaults, ayanamsa: "raman" });
const kp = await castKendraya(birth, { ...defaults, ayanamsa: "kp_new" });
assert.notEqual(raman.chandra.longitude, original.chandra.longitude);
assert.notEqual(kp.chandra.longitude, original.chandra.longitude);
assert.equal(raman.tradition.ayanamsa, "Raman");
const year360 = await castKendraya(birth, { ...defaults, dasaYearDays: 360 });
assert.notEqual(
  year360.vimshottari.balanceAtBirth.endUtc,
  original.vimshottari.balanceAtBirth.endUtc,
);
assert.equal(
  year360.vimshottari.balanceAtBirth.years,
  original.vimshottari.balanceAtBirth.years,
);
const trueNodes = await castKendraya(birth, { ...defaults, nodes: "true" });
const rahu = trueNodes.navagraha.find((p) => p.graha === "Rahu")!,
  ketu = trueNodes.navagraha.find((p) => p.graha === "Ketu")!;
assert.notEqual(
  rahu.longitude,
  original.navagraha.find((p) => p.graha === "Rahu")!.longitude,
);
assert.ok(
  Math.abs(((ketu.longitude - rahu.longitude + 360) % 360) - 180) < 0.000002,
);
assert.deepEqual(trueNodes.chandra, original.chandra);
const sunrise = (disc: "centre" | "upper-limb", refraction: boolean) =>
  Date.parse(
    configuredBirthSunrise(
      original.native.utcTime,
      6.9271,
      79.8612,
      "Asia/Colombo",
      { ...defaults, sunriseDisc: disc, sunriseRefraction: refraction },
    ).sunrise,
  );
assert.ok(sunrise("centre", true) > sunrise("upper-limb", true));
assert.ok(sunrise("centre", false) > sunrise("centre", true));
assert.ok(sunrise("centre", false) < Date.parse(original.native.utcTime));
assert.throws(() =>
  calculationConfigSchema.parse({ ...defaults, ayanamsa: "true_chitra" }),
);
assert.throws(() =>
  calculationConfigSchema.parse({ ...defaults, houseSystem: "placidus" }),
);
for (let i = 0; i < 3; i++) {
  const mixed = await Promise.all([
    castKendraya(birth, { ...defaults, ayanamsa: "raman", nodes: "true" }),
    castKendraya(birth),
    castKendraya(birth, { ...defaults, ayanamsa: "kp_new" }),
  ]);
  assert.deepEqual(
    mixed[1],
    original,
    "mixed-preset concurrency must not leak state",
  );
  assert.deepEqual(mixed[2], kp);
}
validateResolvedCivilTime(
  "2001-07-12",
  "10:30",
  "Asia/Colombo",
  original.native.utcTime,
);
assert.throws(() =>
  validateResolvedCivilTime(
    "1996-05-25",
    "00:30",
    "Asia/Colombo",
    "1996-05-24T19:00:00Z",
  ),
);
assert.throws(() =>
  validateResolvedCivilTime(
    "2006-04-15",
    "00:15",
    "Asia/Colombo",
    "2006-04-14T18:15:00Z",
  ),
);
const dir = await mkdtemp(path.join(tmpdir(), "jyotisha-pro-test-"));
process.env.PRO_DATA_PATH = path.join(dir, "store.enc");
process.env.PRO_STORAGE_KEY = randomBytes(32).toString("hex");
try {
  const token = opaqueToken();
  assert.equal(token.length, 43);
  await transaction((db) => {
    const id = newId();
    db.links.push({
      id,
      ownerId: "owner-a",
      presetId: newId(),
      tokenHash: digest(token),
      label: "synthetic",
      expiresAt: Date.now() + 60000,
      maxUses: 1,
      uses: 0,
      revoked: false,
      createdAt: Date.now(),
    });
  });
  const outcomes = await Promise.allSettled(
    [0, 1].map(() =>
      transaction((db) => {
        usableLink(db, token).uses++;
      }),
    ),
  );
  assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
  await assert.rejects(transaction((db) => usableLink(db, opaqueToken())));
  const raw = await readFile(process.env.PRO_DATA_PATH);
  assert.ok(!raw.toString().includes("synthetic"));
  assert.ok(!raw.toString().includes(token));
  assert.equal(
    await transaction((db) => consumeRate(db, "test", "a", 1, 60)),
    true,
  );
  assert.equal(
    await transaction((db) => consumeRate(db, "test", "a", 1, 60)),
    false,
  );
  assert.equal(
    await transaction((db) => consumeRate(db, "test", "b", 1, 60)),
    true,
  );
  await transaction((db) => {
    db.clients = [];
  });
  await transaction((db) => {
    db.links[0].uses = 0;
    db.links[0].expiresAt = Date.now() - 1;
  });
  await assert.rejects(
    transaction((db) => usableLink(db, token)),
    "expired link denied",
  );
  await transaction((db) => {
    db.clients.push({
      id: newId(),
      ownerId: "owner-a",
      linkId: newId(),
      presetId: newId(),
      input: birth,
      createdAt: Date.now() - 91 * 86400000,
      consentVersion: "pro-v1",
      result: original,
      manifest: {
        config: { ...defaults },
        configHash: "synthetic",
        engine: "test",
        sunriseUtc: undefined,
        balanceDisplay: "test",
      },
    });
  });
  assert.equal(
    await transaction((db) => db.clients.length),
    0,
    "90-day retention purge",
  );
  await writeFile(process.env.PRO_DATA_PATH, "invalid encrypted store");
  await assert.rejects(
    transaction((db) => db.accounts),
    "corruption must fail closed, not overwrite",
  );
  await assert.rejects(
    proLums("/auth/start", {}, z.object({})),
    "missing LUMS must fail closed",
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
console.log(
  "Pro: consumer regression, ayanamsas, true/mean nodes, sunrise, dasa year, mixed-preset concurrency, historical clocks, encrypted storage and limits passed.",
);
