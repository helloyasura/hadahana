import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import {
  NAME_CATALOGUE,
  allowedNames,
  catalogueCoverage,
} from "../src/lib/names/catalogue";
import { curatedNames, curatedPair } from "../src/lib/names/curated-names";
import { NEKATHA_TABLE } from "../src/lib/astrology/nakath-akshara";
const contexts = [
  "buddhist",
  "hindu",
  "christian",
  "islamic",
  "secular",
] as const;
const genders = ["male", "female"] as const;
const tally = (
  key: "culture" | "gender" | "meaningStatus" | "meaningBasis" | "era",
) =>
  Object.fromEntries(
    [...new Set(NAME_CATALOGUE.map((n) => n[key]))].map((v) => [
      v,
      NAME_CATALOGUE.filter((n) => n[key] === v).length,
    ]),
  );
assert(
  NAME_CATALOGUE.length >= 400,
  "Expand only with source-linked records; never fabricate to fill a quota",
);
for (const n of NAME_CATALOGUE) {
  assert(n.roman && n.sinhala && n.meaningSi && n.meaningEn && n.meaningBasis);
  assert(
    /^https:\/\//.test(n.source),
    `${n.roman} must have a real reference link, including review-only records`,
  );
  assert(n.religions.length > 0);
  if (n.meaningEn.startsWith("Derived")) assert.equal(n.meaningBasis, "derived");
  if (n.meaningBasis === "unverified") assert.equal(n.meaningStatus, "review");
  for (const source of n.supportingSources ?? [])
    assert(/^https:\/\//.test(source));
}
const culture = tally("culture");
assert(
  culture.sinhala > culture.tamil &&
    culture.sinhala > culture.arabic &&
    culture.sinhala > culture.international,
);
// Compound deity names cannot leak into Buddhist/neutral suggestions via root-only glosses.
for (const roman of ["Kavish", "Ravish", "Bharath"])
  assert.deepEqual(NAME_CATALOGUE.find((n) => n.roman === roman)!.religions, [
    "hindu",
  ]);
assert.equal(
  NAME_CATALOGUE.find((n) => n.roman === "Lahiru")!.sinhala,
  "ළහිරු",
);
const fixtureLetters = ["ට", "ටි", "ම", "මි", "මු", "ප", "පි"];
const fixture = curatedNames({
  firstLetters: fixtureLetters,
  middleLetters: fixtureLetters,
  primary: "ට",
  gender: "male",
  religion: "buddhist",
  count: 25,
  letterSource: "manual",
  variation: 0.23,
});
assert.equal(
  new Set(fixture.map((n) => n.first.roman)).size,
  25,
  "At least25 distinct first names, not20 recombinations",
);
assert(fixture.every((n) => n.meaningStatus === "sourced"));
assert(
  fixture.some((n) => n.meaningEvidence?.some((e) => e.basis === "derived")),
);
const base = {
  firstLetters: fixtureLetters,
  middleLetters: fixtureLetters,
  primary: "ට",
  gender: "male",
  religion: "buddhist" as const,
  count: 20,
  letterSource: "manual" as const,
  variation: 0.23,
};
// The lightweight ranker's score must remain identical to the rendered pair's score.
for (const n of curatedNames(base)) {
  const [f, m] = n.catalogueIds!.map((id) =>
    NAME_CATALOGUE.find((r) => r.id === id)!,
  );
  assert.equal(n.score, curatedPair(f, m, base).score);
}
const resolved = [
  "Janeesh",
  "Vidiyan",
  "Pavith",
  "Pinsara",
  "Mihin",
  "Mithum",
  "Ravindu",
  "Kavindu",
];
const pending = [
  "Mineth",
  "Minula",
  "Pinith",
  "Pamith",
  "Pulith",
  "Tishan",
  "Monica",
  "Malani",
];
for (const roman of resolved) {
  const n = NAME_CATALOGUE.find((n) => n.roman === roman)!;
  assert.equal(n.meaningStatus, "sourced");
  assert.equal(n.meaningBasis, "derived");
}
for (const roman of pending)
  assert.equal(
    NAME_CATALOGUE.find((n) => n.roman === roman)!.meaningStatus,
    "review",
  );
const letters = [
  ...new Set(NEKATHA_TABLE.flatMap((n) => n.padas.map((p) => p.sinhala))),
];
assert.equal(NEKATHA_TABLE.flatMap((n) => n.padas).length, 108);
const coverage = Object.fromEntries(
  contexts.map((context) => [
    context,
    Object.fromEntries(
      genders.map((gender) => [
        gender,
        catalogueCoverage(letters, gender, context),
      ]),
    ),
  ]),
);
for (const context of contexts)
  for (const gender of genders) {
    const rows = coverage[context][gender];
    assert.equal(rows.length, letters.length);
    assert(rows.every((r) => r.allowedCount >= r.exactCount));
    assert(
      allowedNames(letters, gender, context).length >= 20,
      `${context}/${gender} should have broad coverage`,
    );
  }
const rare = catalogueCoverage(fixtureLetters, "male", "buddhist");
assert(
  rare
    .filter((r) => ["ට", "ටි"].includes(r.letter))
    .every((r) => r.exactCount === 0 && r.allowedCount === 0),
);
assert(
  rare
    .filter((r) => !["ට", "ටි"].includes(r.letter))
    .every((r) => r.allowedCount > 0),
);
// Worst-case all-context, both-gender broad-letter request: only200 narratives are materialised.
const before = process.memoryUsage().heapUsed,
  t = performance.now();
const broad = curatedNames({
  firstLetters: letters,
  middleLetters: letters,
  primary: "අ",
  gender: "unspecified",
  religion: "interfaith",
  traditional: true,
  includeReview: true,
  count: 200,
  letterSource: "manual",
  variation: 0.5,
});
const elapsedMs = Math.round(performance.now() - t),
  heapDeltaBytes = Math.max(0, process.memoryUsage().heapUsed - before);
assert.equal(broad.length, 200);
assert(
  Buffer.byteLength(JSON.stringify(broad)) < 768000,
  "Keep even the largest result payload under the legacy request byte cap",
);
assert(
  heapDeltaBytes < 96 * 1024 * 1024,
  "Do not materialise the full narrative Cartesian product",
);
const stats = {
  total: NAME_CATALOGUE.length,
  byCulture: culture,
  byGender: tally("gender"),
  bySourcing: tally("meaningStatus"),
  byBasis: tally("meaningBasis"),
  byEra: tally("era"),
  byPreference: Object.fromEntries(
    contexts.map((c) => [
      c,
      {
        total: NAME_CATALOGUE.filter((n) => n.religions.includes(c)).length,
        male: NAME_CATALOGUE.filter(
          (n) => n.religions.includes(c) && n.gender === "male",
        ).length,
        female: NAME_CATALOGUE.filter(
          (n) => n.religions.includes(c) && n.gender === "female",
        ).length,
        unisex: NAME_CATALOGUE.filter(
          (n) => n.religions.includes(c) && n.gender === "unisex",
        ).length,
        sourced: NAME_CATALOGUE.filter(
          (n) => n.religions.includes(c) && n.meaningStatus === "sourced",
        ).length,
        review: NAME_CATALOGUE.filter(
          (n) => n.religions.includes(c) && n.meaningStatus === "review",
        ).length,
      },
    ]),
  ),
  benchmark: {
    elapsedMs,
    heapDeltaBytes,
    payloadBytes: Buffer.byteLength(JSON.stringify(broad)),
  },
  fixtureFirstNames: fixture.map((n) => n.first),
  coverage,
};
if (process.env.NAME_CATALOGUE_OUTPUT_PATH)
  await writeFile(
    process.env.NAME_CATALOGUE_OUTPUT_PATH,
    JSON.stringify(stats, null, 2),
  );
console.log(
  "Expanded catalogue tests passed:",
  JSON.stringify({
    ...stats,
    coverage: undefined,
    fixtureFirstNames: undefined,
  }),
);
