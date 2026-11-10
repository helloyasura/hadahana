import type { NamingPersonalityId } from "@/lib/names/personalities";

export type NamePart = {
  sinhala: string;
  roman: string;
  startsWith: string;
  isPrimaryLetter: boolean;
};

/** Multi-factor suitability (LangGraph factor_align critic). */
export type NameFactorScores = {
  /** Match to horoscope-predicted temperament / behaviour */
  horoscopePersonalityFit: number;
  /** Easy to read aloud (Sinhala + roman) */
  readability: number;
  /** Easy to remember */
  memorability: number;
  /** Fits modern / current generation naming taste */
  modernGenerationFit: number;
  /** Clear meaning in the language(s) the family uses */
  meaningLanguageFit: number;
  /** Respectful alignment with religion / faith context */
  religionFit: number;
  /** Practical fit for living country (school, passport, peers) */
  countryFit: number;
};

export type SuggestedName = {
  /** Full given name: first + middle */
  sinhala: string;
  roman: string;
  first: NamePart;
  middle: NamePart;
  /** First-name letter (primary constraint) */
  startsWith: string;
  isPrimaryLetter: boolean;
  meaningSi: string;
  meaningEn: string;
  whySi: string;
  whyEn: string;
  familyFitSi: string;
  familyFitEn: string;
  countryFitSi: string;
  countryFitEn: string;
  agentId: NamingPersonalityId;
  agentLabelSi: string;
  agentLabelEn: string;
  score: number;
  letterSource: "chart" | "manual";
  religionTags?: import("./personalities").ReligionContext[];
  era?: "modern" | "timeless" | "traditional" | "mixed";
  meaningStatus?: "sourced" | "review";
  meaningSources?: string[];
  meaningEvidence?: {
    name: string;
    basis: "lexical" | "name-reference" | "derived" | "unverified";
    sources: string[];
  }[];
  catalogueIds?: string[];
  popularity?: "editorial-unranked";
  /** Current-generation usage verification in living country */
  usageVerified?: boolean;
  usageNoteSi?: string;
  usageNoteEn?: string;
  /** Multi-agent alignment factors (0–100 each) */
  factors?: NameFactorScores;
  /** Critic note: why this name suits horoscope persona + meaning */
  alignWhySi?: string;
  alignWhyEn?: string;
};

export type LetterSource = "chart" | "manual";
