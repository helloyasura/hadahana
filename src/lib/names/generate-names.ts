/**
 * Source-linked, culture-aware name catalogue (public API).
 * Public suggestions never call an AI model or invent meanings.
 */

import { namThebimaOnly, type BirthInput } from "@/lib/astrology/kendraya";
import {
  buildHoroscopePersona,
  type HoroscopePersonaBrief,
} from "@/lib/names/horoscope-persona";
import { aksharaKey } from "@/lib/names/seed-pool";
import { expandLettersWithBase } from "@/lib/names/sinhala-base";
import {
  INTERESTS,
  LIVING_COUNTRIES,
  NAMING_PERSONALITIES,
  NAME_LANGUAGE_OPTIONS,
  RELIGION_OPTIONS,
  type InterestId,
  type LivingCountry,
  type NameLanguagePref,
  type NamingPersonalityId,
  type ReligionContext,
} from "@/lib/names/personalities";
import type { LetterSource, SuggestedName } from "@/lib/names/types";
import { NAME_COUNT_DEFAULT, clampNameCount } from "@/lib/names/name-count";
import { buildLearningSnapshot } from "@/lib/names/feedback-store";
import { catalogueCoverage } from "./catalogue";
import { curatedNames } from "./curated-names";

export type {
  InterestId,
  LivingCountry,
  NamingPersonalityId,
  SuggestedName,
  NameLanguagePref,
  ReligionContext,
};
export type { LetterSource };
export {
  INTERESTS,
  LIVING_COUNTRIES,
  NAMING_PERSONALITIES,
  NAME_LANGUAGE_OPTIONS,
  RELIGION_OPTIONS,
};
export {
  NAME_COUNT_MIN,
  NAME_COUNT_MAX,
  NAME_COUNT_DEFAULT,
  clampNameCount,
} from "@/lib/names/name-count";

export type NameSuggestInput = {
  birth?: BirthInput;
  motherName?: string;
  fatherName?: string;
  siblingNames?: string[];
  interestsMother?: InterestId[];
  interestsFather?: InterestId[];
  sharedHopes?: string;
  livingCountry?: LivingCountry;
  personality?: NamingPersonalityId | "ensemble";
  preferPrimaryLetter?: boolean;
  count?: number;
  letterSource?: LetterSource;
  manualFirstLetters?: string[];
  manualMiddleLetters?: string[];
  religionContext?: ReligionContext;
  nameLanguage?: NameLanguagePref;
  verifyCurrentUsage?: boolean;
  includeTraditional?: boolean;
  includeReview?: boolean;
  excludePairs?: string[];
  variation?: number;
};

function parseManualLetters(raw?: string[]): string[] {
  if (!raw?.length) return [];
  const out: string[] = [];
  for (const chunk of raw) {
    for (const part of chunk.split(/[,،|/·•\s]+/)) {
      const t = aksharaKey(part);
      if (t && !out.includes(t)) out.push(t);
    }
  }
  return out.slice(0, 16);
}

export async function suggestModernNames(input: NameSuggestInput): Promise<{
  unmatchedLetters: string[];
  letterCoverage: ReturnType<typeof catalogueCoverage>;
  letters: {
    primary: string;
    primaryRoman: string;
    all: string[];
    especiallyGood: string[];
    first: string[];
    middle: string[];
  };
  letterSource: LetterSource;
  livingCountry: LivingCountry;
  nameLanguage: NameLanguagePref;
  religionContext: ReligionContext;
  personalitiesUsed: NamingPersonalityId[];
  names: SuggestedName[];
  source:
    | "curated"
    | "langgraph-ensemble"
    | "langgraph"
    | "openai-ensemble"
    | "openai"
    | "seed";
  framework: "langgraph" | "seed" | "curated";
  graphTrace: string[];
  horoscopePersona?: HoroscopePersonaBrief;
  learning?: {
    likedFirst: string[];
    dislikedFirst: string[];
    likedMiddle: string[];
    dislikedMiddle: string[];
  };
  usageVerification?: {
    enabled: boolean;
    live: boolean;
    sources: string[];
    verifiedCount: number;
  };
}> {
  const count = clampNameCount(input.count ?? NAME_COUNT_DEFAULT);
  const country: LivingCountry = input.livingCountry ?? "lk";
  const letterSource: LetterSource = input.letterSource ?? "chart";
  const gender = input.birth?.gender ?? "unspecified";
  const nameLanguage: NameLanguagePref = input.nameLanguage ?? "bilingual";
  const religionContext: ReligionContext =
    input.religionContext && input.religionContext !== "unspecified"
      ? input.religionContext
      : "buddhist";

  let primary = "";
  let primaryRoman = "";
  let all: string[] = [];
  let especiallyGood: string[] = [];
  let firstLetters: string[] = [];
  let middleLetters: string[] = [];
  let horoscopePersona: HoroscopePersonaBrief | undefined;

  if (letterSource === "manual") {
    firstLetters = parseManualLetters(input.manualFirstLetters);
    middleLetters = parseManualLetters(input.manualMiddleLetters);
    if (!firstLetters.length) {
      throw new Error(
        "Manual mode requires at least one first-name starting letter.",
      );
    }
    if (!middleLetters.length) middleLetters = [...firstLetters];
    primary = firstLetters[0];
    primaryRoman = "";
    firstLetters = expandLettersWithBase(firstLetters);
    middleLetters = expandLettersWithBase(middleLetters);
    all = [...new Set([...firstLetters, ...middleLetters])];
    especiallyGood = firstLetters.slice(0, 3);
  } else {
    if (!input.birth) {
      throw new Error("Chart letter mode requires birth details.");
    }
    const nam = await namThebimaOnly(input.birth);
    horoscopePersona = buildHoroscopePersona({
      lagna: nam.lagna,
      chandra: nam.chandra,
    });
    primary = nam.namThebima.primaryAksharaSinhala;
    primaryRoman = nam.namThebima.primaryAksharaRoman;
    all = nam.namThebima.letterSet.allRecommendedSinhala;
    especiallyGood = nam.namThebima.letterSet.especiallyGood;
    const preferLetters =
      input.preferPrimaryLetter !== false
        ? [primary, ...especiallyGood.filter((x) => x !== primary), ...all]
        : [...especiallyGood, primary, ...all];
    firstLetters = expandLettersWithBase([...new Set(preferLetters)]);
    middleLetters = [...firstLetters];
    all = expandLettersWithBase(all);
    especiallyGood = expandLettersWithBase(especiallyGood);
  }

  // Manual letters can still use chart persona when birth is provided.
  if (!horoscopePersona && input.birth) {
    try {
      const nam = await namThebimaOnly(input.birth);
      horoscopePersona = buildHoroscopePersona({
        lagna: nam.lagna,
        chandra: nam.chandra,
      });
    } catch {
      /* persona optional */
    }
  }

  const lettersMeta = {
    primary,
    primaryRoman,
    all,
    especiallyGood,
    first: firstLetters,
    middle: middleLetters,
  };

  const learning = await buildLearningSnapshot();
  const ranked = curatedNames({
    firstLetters,
    middleLetters,
    primary,
    gender,
    religion: religionContext,
    traditional: input.includeTraditional,
    includeReview: input.includeReview,
    count,
    excludePairs: [...(input.excludePairs ?? []), ...learning.dislikedFull],
    excludeParts: [...learning.dislikedFirst, ...learning.dislikedMiddle],
    letterSource,
    country,
    variation: input.variation,
  });

  const letterCoverage = catalogueCoverage(
    firstLetters,
    gender,
    religionContext,
    input.includeTraditional,
    input.includeReview,
  );
  return {
    letterCoverage,
    unmatchedLetters: letterCoverage
      .filter((c) => !c.allowedCount)
      .map((c) => c.letter),
    letters: lettersMeta,
    letterSource,
    livingCountry: country,
    nameLanguage,
    religionContext,
    personalitiesUsed: ["sinhala_language"],
    names: ranked.slice(0, count),
    source: "curated",
    framework: "curated",
    graphTrace: [
      "curated_allowlist",
      "culture_gender_letter_gates",
      "meaning_review_gate",
      "modern_readable_rank",
      "diverse_pairs",
    ],
    horoscopePersona,
    learning: {
      likedFirst: learning.likedFirst,
      dislikedFirst: learning.dislikedFirst,
      likedMiddle: learning.likedMiddle,
      dislikedMiddle: learning.dislikedMiddle,
    },
    usageVerification: {
      enabled: false,
      live: false,
      sources: [],
      verifiedCount: 0,
    },
  };
}
