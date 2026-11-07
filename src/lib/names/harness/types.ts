import type { BirthInput } from "@/lib/astrology/kendraya";
import type { LearningSnapshot } from "@/lib/names/feedback-store";
import type { HoroscopePersonaBrief } from "@/lib/names/horoscope-persona";
import type {
  InterestId,
  LivingCountry,
  NameLanguagePref,
  NamingPersonalityId,
  ReligionContext,
} from "@/lib/names/personalities";
import type { LetterSource, SuggestedName } from "@/lib/names/types";

export type NamingHarnessContext = {
  input: {
    motherName?: string;
    fatherName?: string;
    siblingNames?: string[];
    interestsMother?: InterestId[];
    interestsFather?: InterestId[];
    sharedHopes?: string;
    religionContext: ReligionContext;
    nameLanguage: NameLanguagePref;
  };
  gender: BirthInput["gender"] | "unspecified";
  country: LivingCountry;
  letterSource: LetterSource;
  primary: string;
  primaryRoman: string;
  firstLetters: string[];
  middleLetters: string[];
  personalities: NamingPersonalityId[];
  perCount: number;
  targetCount: number;
  currentUsageSample?: string;
  model: string;
  /** Lagna + Moon temperament brief for personality-aligned naming */
  horoscopePersona?: HoroscopePersonaBrief;
  /** Aggregated like/dislike learning from the feedback DB */
  learning?: LearningSnapshot;
};

export type NamingHarnessResult = {
  names: SuggestedName[];
  personalitiesUsed: NamingPersonalityId[];
  source:
    | "langgraph-ensemble"
    | "langgraph"
    | "openai-ensemble"
    | "openai"
    | "seed";
  framework: "langgraph" | "seed";
  graphTrace: string[];
  horoscopePersona?: HoroscopePersonaBrief;
};
