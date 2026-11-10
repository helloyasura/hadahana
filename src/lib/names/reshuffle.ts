/**
 * Replace a disliked first or middle name with another suitable part,
 * preferring learned uprates and avoiding downrated parts.
 */

import type { BirthInput } from "@/lib/astrology/kendraya";
import type { LearningSnapshot } from "./feedback-store";
import type {
  LivingCountry,
  NamingPersonalityId,
  ReligionContext,
} from "./personalities";
import type { LetterSource, SuggestedName } from "./types";
import { curatedNames, pairKey } from "./curated-names";
export type ReshufflePart = "first" | "middle";
const romanKey = pairKey;
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
  religionContext?: ReligionContext;
  includeTraditional?: boolean;
  includeReview?: boolean;
  excludePairs?: string[];
  excludeParts?: string[];
}): SuggestedName | null {
  const { current, part } = input;
  const excluded = [
    ...(input.excludePairs ?? []),
    ...input.pool.map((n) => `${n.first.roman} ${n.middle.roman}`),
    `${current.first.roman} ${current.middle.roman}`,
    ...(input.learning?.dislikedFull ?? []),
  ];
  const blocked = [
    ...(input.excludeParts ?? []),
    ...(input.learning?.dislikedFirst ?? []),
    ...(input.learning?.dislikedMiddle ?? []),
  ];
  const candidates = curatedNames({
    firstLetters: input.firstLetters,
    middleLetters: input.middleLetters.length
      ? input.middleLetters
      : input.firstLetters,
    primary: input.primary,
    gender: input.gender ?? "unspecified",
    religion: input.religionContext,
    traditional: input.includeTraditional,
    includeReview: input.includeReview,
    count: 200,
    fixedFirst: part === "middle" ? current.first.roman : undefined,
    fixedMiddle: part === "first" ? current.middle.roman : undefined,
    excludePairs: excluded,
    excludeParts: blocked,
    letterSource: input.letterSource,
    country: input.country,
  });
  return (
    candidates.find((n) =>
      part === "first"
        ? pairKey(n.middle.roman) === pairKey(current.middle.roman) &&
          pairKey(n.first.roman) !== pairKey(current.first.roman)
        : pairKey(n.first.roman) === pairKey(current.first.roman) &&
          pairKey(n.middle.roman) !== pairKey(current.middle.roman),
    ) ?? null
  );
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
    if (
      learning.likedFirst.some((x) => romanKey(x) === romanKey(n.first.roman))
    )
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
    lines.push(
      `Prefer first names like: ${learning.likedFirst.slice(0, 12).join(", ")}`,
    );
  }
  if (learning.dislikedFirst.length) {
    lines.push(
      `NEVER use these disliked first names: ${learning.dislikedFirst.slice(0, 20).join(", ")}`,
    );
  }
  if (learning.likedMiddle.length) {
    lines.push(
      `Prefer middle names like: ${learning.likedMiddle.slice(0, 12).join(", ")}`,
    );
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
