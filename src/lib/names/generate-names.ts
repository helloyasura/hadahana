/**
 * Agentic modern name studio (public API).
 * Orchestration runs through the LangGraph naming harness.
 */

import { namThebimaOnly, type BirthInput } from "@/lib/astrology/kendraya";
import {
  applyDeterministicFactors,
  sortByAlignment,
} from "@/lib/names/factor-align";
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
import {
  loadCurrentUsage,
  usagePromptSample,
  verifyNameAgainstUsage,
} from "@/lib/names/current-usage";
import {
  runNamingHarness,
  selectPersonalities,
} from "@/lib/names/harness";
import {
  NAME_COUNT_DEFAULT,
  clampNameCount,
} from "@/lib/names/name-count";
import { buildLearningSnapshot } from "@/lib/names/feedback-store";
import { applyLearningToNames } from "@/lib/names/reshuffle";

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

function applyUsageVerification(
  names: SuggestedName[],
  pack: Awaited<ReturnType<typeof loadCurrentUsage>>,
): SuggestedName[] {
  return names.map((n) => {
    const v = verifyNameAgainstUsage(
      n.first.roman,
      n.middle.roman,
      n.first.sinhala,
      n.middle.sinhala,
      pack,
    );
    const factors = n.factors
      ? {
          ...n.factors,
          modernGenerationFit: Math.min(
            100,
            n.factors.modernGenerationFit + (v.anyHit ? 14 : 0),
          ),
        }
      : n.factors;
    return {
      ...n,
      factors,
      score: Math.min(100, n.score + v.boost),
      usageVerified: v.anyHit,
      usageNoteSi: v.noteSi,
      usageNoteEn: v.noteEn,
      countryFitSi: `${n.countryFitSi} ${v.noteSi}`.trim(),
      countryFitEn: `${n.countryFitEn} ${v.noteEn}`.trim(),
    };
  });
}

export async function suggestModernNames(input: NameSuggestInput): Promise<{
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
    | "langgraph-ensemble"
    | "langgraph"
    | "openai-ensemble"
    | "openai"
    | "seed";
  framework: "langgraph" | "seed";
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
    input.religionContext ?? "unspecified";
  const verifyUsage = input.verifyCurrentUsage !== false;

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

  const mode = input.personality ?? "ensemble";
  const personalities = selectPersonalities(mode, country);
  const lettersMeta = {
    primary,
    primaryRoman,
    all,
    especiallyGood,
    first: firstLetters,
    middle: middleLetters,
  };

  const usagePack = verifyUsage
    ? await loadCurrentUsage(country, nameLanguage)
    : null;
  const usageSample = usagePack ? usagePromptSample(usagePack) : undefined;
  const learning = await buildLearningSnapshot();

  const harness = await runNamingHarness({
    input: {
      motherName: input.motherName,
      fatherName: input.fatherName,
      siblingNames: input.siblingNames,
      interestsMother: input.interestsMother,
      interestsFather: input.interestsFather,
      sharedHopes: input.sharedHopes,
      religionContext,
      nameLanguage,
    },
    gender,
    country,
    letterSource,
    primary,
    primaryRoman,
    firstLetters,
    middleLetters,
    personalities,
    perCount: Math.max(
      3,
      Math.ceil(count / personalities.length) + (count <= 12 ? 2 : 1),
    ),
    targetCount: count,
    currentUsageSample: usageSample,
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    horoscopePersona,
    learning,
  });

  let ranked = harness.names;
  if (!ranked.some((n) => n.factors)) {
    ranked = applyDeterministicFactors(ranked, {
      persona: horoscopePersona,
      country,
      nameLanguage,
      religion: religionContext,
    });
  }
  ranked = usagePack ? applyUsageVerification(ranked, usagePack) : ranked;
  ranked = sortByAlignment(ranked);
  ranked = applyLearningToNames(ranked, learning);

  return {
    letters: lettersMeta,
    letterSource,
    livingCountry: country,
    nameLanguage,
    religionContext,
    personalitiesUsed: harness.personalitiesUsed,
    names: ranked.slice(0, count),
    source: harness.source,
    framework: harness.framework,
    graphTrace: harness.graphTrace,
    horoscopePersona,
    learning: {
      likedFirst: learning.likedFirst,
      dislikedFirst: learning.dislikedFirst,
      likedMiddle: learning.likedMiddle,
      dislikedMiddle: learning.dislikedMiddle,
    },
    usageVerification: usagePack
      ? {
          enabled: true,
          live: usagePack.live,
          sources: usagePack.sourceLabels,
          verifiedCount: ranked.filter((n) => n.usageVerified).length,
        }
      : { enabled: false, live: false, sources: [], verifiedCount: 0 },
  };
}
