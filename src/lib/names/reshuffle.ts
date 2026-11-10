/**
 * Replace a disliked first or middle name with another suitable part,
 * preferring learned uprates and avoiding downrated parts.
 */

import type { BirthInput } from "@/lib/astrology/kendraya";
import type { LearningSnapshot } from "@/lib/names/feedback-store";
import { makePart } from "@/lib/names/name-pipeline";
import type { LivingCountry, NamingPersonalityId } from "@/lib/names/personalities";
import { personalityById } from "@/lib/names/personalities";
import { seedsForLetters } from "@/lib/names/seed-pool";
import type { LetterSource, NamePart, SuggestedName } from "@/lib/names/types";

export type ReshufflePart = "first" | "middle";

function romanKey(s: string): string {
  return s.trim().toLowerCase();
}

function partFromSeed(
  seed: { sinhala: string; roman: string; startsWith: string; meaningSi: string; meaningEn: string },
  primary: string,
): { part: NamePart; meaningSi: string; meaningEn: string } {
  return {
    part: makePart(seed.sinhala, seed.roman, seed.startsWith, primary),
    meaningSi: seed.meaningSi,
    meaningEn: seed.meaningEn,
  };
}

function scoreCandidate(
  roman: string,
  kind: ReshufflePart,
  learning: LearningSnapshot | undefined,
): number {
  if (!learning) return 0;
  const net =
    kind === "first"
      ? (learning.firstNet[romanKey(roman)] ?? 0)
      : (learning.middleNet[romanKey(roman)] ?? 0);
  return net * 10;
}

function isAvoided(
  roman: string,
  kind: ReshufflePart,
  learning: LearningSnapshot | undefined,
): boolean {
  if (!learning) return false;
  const list =
    kind === "first" ? learning.dislikedFirst : learning.dislikedMiddle;
  return list.some((x) => romanKey(x) === romanKey(roman));
}

/**
 * Build a replacement SuggestedName by swapping first or middle.
 * Candidates come from sibling suggestions' parts + letter seed pool.
 */
export function reshuffleNamePart(input: {
  current: SuggestedName;
  part: ReshufflePart;
  pool: SuggestedName[];
  firstLetters: string[];
  middleLetters: string[];
  primary: string;
  gender: BirthInput["gender"] | "unspecified";
  country: LivingCountry;
  letterSource: LetterSource;
  learning?: LearningSnapshot;
  agentId?: NamingPersonalityId;
}): SuggestedName | null {
  const {
    current,
    part,
    pool,
    firstLetters,
    middleLetters,
    primary,
    gender,
    letterSource,
    learning,
  } = input;
  const g =
    gender === "male" || gender === "female" ? gender : "unspecified";
  const agentId = (input.agentId ?? current.agentId) as NamingPersonalityId;
  const agent = personalityById(agentId);

  const avoidFull = new Set(
    (learning?.dislikedFull ?? []).map(romanKey),
  );
  const usedFirst = new Set(
    pool.map((n) => romanKey(n.first.roman)).concat(romanKey(current.first.roman)),
  );
  const usedMiddle = new Set(
    pool.map((n) => romanKey(n.middle.roman)).concat(romanKey(current.middle.roman)),
  );

  type Cand = {
    part: NamePart;
    meaningSi: string;
    meaningEn: string;
    score: number;
  };
  const cands: Cand[] = [];

  if (part === "first") {
    for (const n of pool) {
      if (romanKey(n.first.roman) === romanKey(current.first.roman)) continue;
      if (isAvoided(n.first.roman, "first", learning)) continue;
      const combo = `${n.first.roman} ${current.middle.roman}`;
      if (avoidFull.has(romanKey(combo))) continue;
      if (romanKey(n.first.roman) === romanKey(current.middle.roman)) continue;
      cands.push({
        part: n.first,
        meaningSi: n.meaningSi.split("·")[0]?.trim() || n.meaningSi,
        meaningEn: n.meaningEn.split("·")[0]?.trim() || n.meaningEn,
        score:
          scoreCandidate(n.first.roman, "first", learning) +
          (n.isPrimaryLetter ? 5 : 0) +
          Math.random() * 3,
      });
    }
    const seeds = seedsForLetters(firstLetters, g);
    for (const s of seeds) {
      if (usedFirst.has(romanKey(s.roman))) continue;
      if (isAvoided(s.roman, "first", learning)) continue;
      if (romanKey(s.roman) === romanKey(current.middle.roman)) continue;
      const built = partFromSeed(s, primary);
      cands.push({
        ...built,
        score: scoreCandidate(s.roman, "first", learning) + Math.random() * 4,
      });
    }
  } else {
    for (const n of pool) {
      if (romanKey(n.middle.roman) === romanKey(current.middle.roman)) continue;
      if (isAvoided(n.middle.roman, "middle", learning)) continue;
      const combo = `${current.first.roman} ${n.middle.roman}`;
      if (avoidFull.has(romanKey(combo))) continue;
      if (romanKey(n.middle.roman) === romanKey(current.first.roman)) continue;
      cands.push({
        part: n.middle,
        meaningSi: n.meaningSi.split("·")[1]?.trim() || n.meaningSi,
        meaningEn: n.meaningEn.split("·")[1]?.trim() || n.meaningEn,
        score:
          scoreCandidate(n.middle.roman, "middle", learning) +
          Math.random() * 3,
      });
    }
    const seeds = seedsForLetters(
      middleLetters.length ? middleLetters : firstLetters,
      g,
    );
    for (const s of seeds) {
      if (usedMiddle.has(romanKey(s.roman))) continue;
      if (isAvoided(s.roman, "middle", learning)) continue;
      if (romanKey(s.roman) === romanKey(current.first.roman)) continue;
      const built = partFromSeed(s, primary);
      cands.push({
        ...built,
        score: scoreCandidate(s.roman, "middle", learning) + Math.random() * 4,
      });
    }
  }

  if (!cands.length) return null;
  cands.sort((a, b) => b.score - a.score);
  // Soft random among top few so repeats feel fresh.
  const top = cands.slice(0, Math.min(6, cands.length));
  const pick = top[Math.floor(Math.random() * top.length)]!;

  const first = part === "first" ? pick.part : current.first;
  const middle = part === "middle" ? pick.part : current.middle;
  const firstMeaningSi =
    part === "first"
      ? pick.meaningSi
      : current.meaningSi.split("·")[0]?.trim() || current.meaningSi;
  const firstMeaningEn =
    part === "first"
      ? pick.meaningEn
      : current.meaningEn.split("·")[0]?.trim() || current.meaningEn;
  const midMeaningSi =
    part === "middle"
      ? pick.meaningSi
      : current.meaningSi.split("·")[1]?.trim() || current.meaningSi;
  const midMeaningEn =
    part === "middle"
      ? pick.meaningEn
      : current.meaningEn.split("·")[1]?.trim() || current.meaningEn;

  return {
    ...current,
    first,
    middle,
    sinhala: `${first.sinhala} ${middle.sinhala}`,
    roman: `${first.roman} ${middle.roman}`,
    startsWith: first.startsWith,
    isPrimaryLetter: first.isPrimaryLetter,
    meaningSi: `${firstMeaningSi} · ${midMeaningSi}`,
    meaningEn: `${firstMeaningEn} · ${midMeaningEn}`,
    whySi:
      part === "first"
        ? `ප්‍රතිපෝෂණය අනුව මුල් නම අහඹුවෙන් වෙනස් කළා; මධ්‍ය ${middle.sinhala} රඳවා ගත්තා.`
        : `ප්‍රතිපෝෂණය අනුව මධ්‍ය නම අහඹුවෙන් වෙනස් කළා; මුල් ${first.sinhala} රඳවා ගත්තා.`,
    whyEn:
      part === "first"
        ? `Reshuffled first name from feedback; kept middle ${middle.roman}.`
        : `Reshuffled middle name from feedback; kept first ${first.roman}.`,
    agentId: agent.id,
    agentLabelSi: agent.si,
    agentLabelEn: agent.en,
    score: Math.min(
      100,
      (current.score || 70) +
        scoreCandidate(
          part === "first" ? first.roman : middle.roman,
          part,
          learning,
        ),
    ),
    letterSource,
    countryFitSi: current.countryFitSi,
    countryFitEn: current.countryFitEn,
    familyFitSi: current.familyFitSi,
    familyFitEn: current.familyFitEn,
  };
}

/** Apply learning boosts/penalties to a ranked list after generation. */
export function applyLearningToNames(
  names: SuggestedName[],
  learning: LearningSnapshot,
): SuggestedName[] {
  const mapped = names.map((n) => {
    const firstNet = learning.firstNet[romanKey(n.first.roman)] ?? 0;
    const middleNet = learning.middleNet[romanKey(n.middle.roman)] ?? 0;
    const fullKey = romanKey(n.roman);
    const fullDisliked = learning.dislikedFull.some(
      (x) => romanKey(x) === fullKey,
    );
    const firstBanned = learning.dislikedFirst.some(
      (x) => romanKey(x) === romanKey(n.first.roman),
    );
    let delta = firstNet * 4 + middleNet * 2;
    if (fullDisliked) delta -= 25;
    if (firstBanned) delta -= 35;
    if (learning.likedFirst.some((x) => romanKey(x) === romanKey(n.first.roman)))
      delta += 8;
    return {
      ...n,
      score: Math.max(0, Math.min(100, Math.round(n.score + delta))),
    };
  });
  const filtered = mapped.filter((n) => {
    // Soft-filter heavily downrated first names unless that would empty the list.
    const banned = learning.dislikedFirst.some(
      (x) => romanKey(x) === romanKey(n.first.roman),
    );
    return !banned;
  });
  const list = filtered.length ? filtered : mapped;
  return list.sort(
    (a, b) =>
      Number(b.isPrimaryLetter) - Number(a.isPrimaryLetter) ||
      b.score - a.score,
  );
}

export function learningPromptBlock(learning: LearningSnapshot): string {
  const lines: string[] = ["USER FEEDBACK LEARNING (from prior like/dislike):"];
  if (learning.likedFirst.length) {
    lines.push(`Prefer first names like: ${learning.likedFirst.slice(0, 12).join(", ")}`);
  }
  if (learning.dislikedFirst.length) {
    lines.push(
      `NEVER use these disliked first names: ${learning.dislikedFirst.slice(0, 20).join(", ")}`,
    );
  }
  if (learning.likedMiddle.length) {
    lines.push(`Prefer middle names like: ${learning.likedMiddle.slice(0, 12).join(", ")}`);
  }
  if (learning.dislikedMiddle.length) {
    lines.push(
      `Avoid these disliked middle names: ${learning.dislikedMiddle.slice(0, 20).join(", ")}`,
    );
  }
  if (learning.dislikedFull.length) {
    lines.push(
      `Avoid these full pairs: ${learning.dislikedFull.slice(0, 10).join("; ")}`,
    );
  }
  if (lines.length === 1) {
    return "USER FEEDBACK LEARNING: none yet — explore diverse suitable names.";
  }
  return lines.join("\n");
}
