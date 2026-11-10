/**
 * Smoke-test Name Studio: first+middle pairs for chart (මො) and manual letters.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { suggestModernNames } from "../src/lib/names/generate-names";

const birth = {
  date: "2026-11-04",
  time: "07:46",
  placeId: "asiri-kandy",
  placeName: "907 Peradeniya Rd, Mulgampola, Kandy",
  latitude: 7.2744,
  longitude: 80.61115,
  gender: "male" as const,
  nativeName: "Asiri",
};

function assertPairs(label: string, names: Awaited<ReturnType<typeof suggestModernNames>>["names"]) {
  if (names.length < 12) throw new Error(`${label}: too few names (${names.length})`);
  for (const n of names) {
    if (!n.first?.roman || !n.middle?.roman) {
      throw new Error(`${label}: missing first/middle on ${n.roman}`);
    }
    if (n.first.roman.toLowerCase() === n.middle.roman.toLowerCase()) {
      throw new Error(`${label}: first==middle ${n.roman}`);
    }
    if (!n.sinhala.includes(" ") || !n.roman.includes(" ")) {
      throw new Error(`${label}: full name not paired: ${n.roman}`);
    }
  }
}

async function runChart() {
  const result = await suggestModernNames({
    birth,
    motherName: "Nadeesha",
    fatherName: "Asanka",
    siblingNames: ["Sahan"],
    interestsMother: ["kindness", "education"],
    interestsFather: ["leadership", "sports"],
    sharedHopes: "kind, studious, easy abroad",
    livingCountry: "lk",
    personality: "ensemble",
    preferPrimaryLetter: true,
    letterSource: "chart",
    religionContext: "buddhist",
    nameLanguage: "bilingual",
    verifyCurrentUsage: true,
    count: 20,
  });
  assertPairs("chart", result.names);
  if (result.source !== "curated" || result.framework !== "curated") throw new Error("Expected curated allowlist, not ungrounded AI output");
  if (!result.names.every(n=>n.meaningStatus==='sourced' && n.religionTags?.includes('buddhist'))) throw new Error('Culture/meaning gate failed');
  console.log(
    JSON.stringify(
      {
        mode: "chart",
        source: result.source,
        framework: result.framework,
        graphTrace: result.graphTrace?.slice(0, 10),
        primary: result.letters.primary,
        count: result.names.length,
        agents: result.personalitiesUsed,
        usage: result.usageVerification,
        sample: result.names.slice(0, 4).map((n) => ({
          full: n.roman,
          first: n.first.roman,
          middle: n.middle.roman,
          letters: `${n.first.startsWith}+${n.middle.startsWith}`,
          agent: n.agentId,
          verified: n.usageVerified,
        })),
      },
      null,
      2,
    ),
  );
}

async function runManual() {
  const result = await suggestModernNames({
    birth,
    motherName: "Nadeesha",
    fatherName: "Asanka",
    livingCountry: "au",
    personality: "ensemble",
    letterSource: "manual",
    manualFirstLetters: ["මො", "ර"],
    manualMiddleLetters: ["ස", "ක"],
    religionContext: "interfaith",
    nameLanguage: "en",
    verifyCurrentUsage: true,
    count: 16,
  });
  assertPairs("manual", result.names);
  if (result.letterSource !== "manual") throw new Error("expected manual source");
  console.log(
    JSON.stringify(
      {
        mode: "manual",
        source: result.source,
        firstLetters: result.letters.first,
        middleLetters: result.letters.middle,
        count: result.names.length,
        agents: result.personalitiesUsed,
        usage: result.usageVerification,
        sample: result.names.slice(0, 3).map((n) => ({
          full: n.roman,
          first: `${n.first.roman}(${n.first.startsWith})`,
          middle: `${n.middle.roman}(${n.middle.startsWith})`,
          verified: n.usageVerified,
        })),
      },
      null,
      2,
    ),
  );
}

async function runBaseConsonant() {
  const result = await suggestModernNames({
    birth,
    letterSource: "manual",
    manualFirstLetters: ["මො"],
    manualMiddleLetters: ["ර"],
    livingCountry: "lk",
    personality: "athurudaya",
    verifyCurrentUsage: false,
    count: 16,
  });
  if (!result.letters.first.includes("ම")) {
    throw new Error("මො should expand to include base ම");
  }
  const baseHits = result.names.filter(
    (n) =>
      n.first.startsWith === "ම" ||
      (n.first.sinhala.startsWith("ම") &&
        !n.first.sinhala.startsWith("මො") &&
        !n.first.sinhala.startsWith("මෝ")),
  );
  if (!baseHits.length) {
    throw new Error("expected at least one ම-base first name for මො");
  }
  console.log(
    JSON.stringify(
      {
        mode: "base-consonant",
        letters: result.letters.first,
        baseSample: baseHits.slice(0, 3).map((n) => ({
          si: n.first.sinhala,
          roman: n.first.roman,
          start: n.first.startsWith,
        })),
      },
      null,
      2,
    ),
  );
}

async function main() {
  await runChart();
  await runManual();
  await runBaseConsonant();
  console.log("OK verify-names first+middle + manual + base consonant");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
