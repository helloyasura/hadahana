import assert from "node:assert/strict";
import { nameMatchesLetter } from "../src/lib/names/sinhala-base";
import { allowedNames, NAME_CATALOGUE } from "../src/lib/names/catalogue";
import { curatedNames, modernity } from "../src/lib/names/curated-names";
import { reshuffleNamePart } from "../src/lib/names/reshuffle";
import { reshuffleSchema } from "../src/lib/names/reshuffle-schema";
import { writeFile } from "node:fs/promises";
const o = {
  firstLetters: ["ට", "ටි", "ම", "මි", "මු", "ප", "පි"],
  middleLetters: ["ට", "ටි", "ම", "මි", "මු", "ප", "පි"],
  primary: "ට",
  gender: "male",
  religion: "buddhist" as const,
  count: 20,
  letterSource: "manual" as const,
  variation: 0.23,
};
const names = curatedNames(o);
assert.equal(names.length, 20);
assert.equal(new Set(names.map((n) => n.roman)).size, 20);
assert(
  new Set(names.map((n) => n.first.roman)).size === 20,
  "Twenty distinct first names, not recombined filler",
);
assert(
  !names.some((n) =>
    /moses|mohan|mahesh|manoj|moran|mokan|tishan/i.test(n.roman),
  ),
);
assert(
  names.every(
    (n) =>
      n.religionTags?.includes("buddhist") &&
      n.meaningStatus === "sourced" &&
      n.meaningSources?.length === 2,
  ),
);
assert(
  !allowedNames(["ට", "ටි"], "male", "buddhist").length,
  "No invented retroflex-letter names",
);
assert(
  allowedNames(["ට", "ටි"], "male", "buddhist", false, true).some(
    (n) => n.roman === "Tishan",
  ),
);
assert.equal(
  nameMatchesLetter("තරිඳු", "Tharindu", "ට"),
  false,
  "Roman Th must not pass retroflex T",
);
assert(
  !allowedNames(["ත"], "male", "buddhist", false, true).some(
    (n) => n.roman === "Tishan",
  ),
  "Never confuse ට and ත",
);
for (const religion of [
  "buddhist",
  "hindu",
  "christian",
  "islamic",
  "secular",
] as const) {
  for (const gender of ["male", "female"] as const) {
    const all = allowedNames(
      ["ම", "ප", "අ", "ඇ", "ක", "න", "ඩ", "ග", "ස", "ර", "ය", "ආ", "ඉ"],
      gender,
      religion,
    );
    assert(all.length >= 2, `${religion} ${gender} coverage`);
    assert(
      all.every(
        (n) =>
          n.religions.includes(religion) &&
          (n.gender === gender || n.gender === "unisex"),
      ),
    );
  }
}
assert(
  allowedNames(["ම"], "male", "hindu", true).some((n) => n.roman === "Mahesh"),
);
assert(
  !allowedNames(["ම"], "male", "buddhist", true).some(
    (n) => n.roman === "Mahesh",
  ),
);
assert(
  !allowedNames(["ප"], "male", "buddhist").some((n) => n.roman === "Prasanna"),
);
assert(
  allowedNames(["ප"], "male", "buddhist", true).some(
    (n) => n.roman === "Prasanna",
  ),
);
assert(
  modernity(NAME_CATALOGUE.find((n) => n.roman === "Janeesh")!) >
    modernity(NAME_CATALOGUE.find((n) => n.roman === "Prasanna")!),
);
for (const n of NAME_CATALOGUE.filter((n) => n.meaningStatus === "review"))
  assert(!names.some((p) => p.catalogueIds?.includes(n.id)));
const again = curatedNames({
  ...o,
  excludePairs: names.map((n) => n.roman),
  variation: 0.76,
});
assert(again.length > 0);
assert(again.every((n) => !names.some((p) => p.roman === n.roman)));
const history = names.map((n) => n.roman),
  parts: string[] = [];
let current = names[0],
  iterations = 0;
while (iterations++ < 20) {
  const next = reshuffleNamePart({
    current,
    part: "first",
    pool: names,
    firstLetters: o.firstLetters,
    middleLetters: o.middleLetters,
    primary: o.primary,
    gender: "male",
    country: "lk",
    letterSource: "manual",
    religionContext: "buddhist",
    excludePairs: history,
    excludeParts: parts,
  });
  if (!next) break;
  assert(!history.includes(next.roman));
  assert.equal(next.middle.roman, current.middle.roman);
  history.push(next.roman);
  parts.push(current.first.roman);
  current = next;
}
assert(iterations > 1, "At least one unused replacement");
const legacy = {
  part: "first",
  current: names[0],
  pool: Array(100).fill(names[0]),
  firstLetters: o.firstLetters,
  primary: "ට",
};
assert(
  reshuffleSchema.safeParse(legacy).success,
  "100-item client pool fits public 200-name limit",
);
assert(
  !reshuffleSchema.safeParse({ ...legacy, pool: Array(201).fill(names[0]) })
    .success,
);
assert(
  reshuffleSchema.safeParse({
    ...legacy,
    current: { first: names[0].first, middle: names[0].middle },
  }).success,
  "Narrative fields are not a wire contract",
);
assert(!reshuffleSchema.safeParse({ ...legacy, firstLetters: [] }).success);
assert.equal(
  new Set(NAME_CATALOGUE.map((n) => n.sinhala.normalize("NFC"))).size,
  NAME_CATALOGUE.length,
  "No duplicate Sinhala names",
);
assert.equal(
  new Set(NAME_CATALOGUE.map((n) => n.roman.toLowerCase())).size,
  NAME_CATALOGUE.length,
  "No duplicate Roman names",
);
if (process.env.NAME_QUALITY_OUTPUT_PATH)
  await writeFile(
    process.env.NAME_QUALITY_OUTPUT_PATH,
    JSON.stringify(
      {
        names,
        review: NAME_CATALOGUE.filter((n) => n.meaningStatus === "review"),
      },
      null,
      2,
    ),
  );
console.log(
  "Name-quality tests passed. Deterministic Buddhist boy fixture top 20 pairs:",
);
console.log(
  names.map((n) => `${n.roman} / ${n.sinhala} — ${n.meaningEn}`).join("\n"),
);
