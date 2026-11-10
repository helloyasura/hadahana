/**
 * Multi-factor name suitability scoring for the LangGraph harness.
 *
 * Factors (aligned under critic `factor_align` node):
 * 1. horoscopePersonalityFit — chart temperament / behaviour
 * 2. readability — easy to read aloud (SI + roman)
 * 3. memorability — easy to remember
 * 4. modernGenerationFit — current generation feel
 * 5. meaningLanguageFit — meaning clear in preferred language
 * 6. religionFit — respectful of faith context
 * 7. countryFit — living-country school / passport ease
 */

import { scoreReadability } from "./readability";
export { scoreReadability } from "./readability";

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { HoroscopePersonaBrief } from "@/lib/names/horoscope-persona";
import type {
  LivingCountry,
  NameLanguagePref,
  ReligionContext,
} from "@/lib/names/personalities";
import type { NameFactorScores, SuggestedName } from "@/lib/names/types";

export const FACTOR_WEIGHTS: Record<keyof NameFactorScores, number> = {
  horoscopePersonalityFit: 0.22,
  readability: 0.12,
  memorability: 0.12,
  modernGenerationFit: 0.14,
  meaningLanguageFit: 0.14,
  religionFit: 0.13,
  countryFit: 0.13,
};

const llmFactorSchema = z.object({
  scores: z.array(
    z.object({
      roman: z.string(),
      horoscopePersonalityFit: z.number().min(0).max(100),
      meaningLanguageFit: z.number().min(0).max(100),
      religionFit: z.number().min(0).max(100),
      modernGenerationFit: z.number().min(0).max(100).optional(),
      alignWhyEn: z.string().optional(),
      alignWhySi: z.string().optional(),
    }),
  ),
});

function syllableApprox(roman: string): number {
  const parts = roman.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  let n = 0;
  for (const w of parts) {
    const groups = w.match(/[aeiouy]+/g);
    n += groups?.length || 1;
  }
  return Math.max(1, n);
}

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Deterministic memorability: syllable budget + distinct parts. */
export function scoreMemorability(n: SuggestedName): number {
  const syl = syllableApprox(`${n.first.roman} ${n.middle.roman}`);
  let s = 70;
  if (syl >= 3 && syl <= 6) s += 16;
  else if (syl === 2 || syl === 7) s += 6;
  else if (syl > 8) s -= 14;

  if (n.first.roman.length <= 8 && n.middle.roman.length <= 8) s += 6;
  if (
    n.first.roman[0]?.toLowerCase() === n.middle.roman[0]?.toLowerCase()
  ) {
    s += 4; // soft alliteration aids memory
  }
  if (n.first.roman.toLowerCase() === n.middle.roman.toLowerCase()) s -= 30;
  return clamp(s);
}

/** Modern generation heuristic (usageVerified boosts later). */
export function scoreModernHeuristic(
  n: SuggestedName,
  country: LivingCountry,
): number {
  let s = 68;
  const full = `${n.first.roman} ${n.middle.roman}`;
  if (full.length <= 18) s += 8;
  if (!/[áéíóúāīūṣṇṭḍḷṛḥ]/i.test(full)) s += 4;
  if (country !== "lk" && /^[A-Za-z ]+$/.test(full)) s += 8;
  if (/\b(deva|devi|kumara|kumari)\b/i.test(full) && country !== "lk") s -= 6;
  if (n.usageVerified) s += 18;
  return clamp(s);
}

export function scoreCountryHeuristic(
  n: SuggestedName,
  country: LivingCountry,
): number {
  let s = 70;
  const roman = `${n.first.roman} ${n.middle.roman}`;
  if (country === "lk") {
    if (n.first.sinhala && n.middle.sinhala) s += 12;
    if (roman.length <= 20) s += 6;
  } else {
    if (/^[A-Za-z ]+$/.test(roman)) s += 14;
    if (roman.replace(/\s/g, "").length <= 14) s += 8;
    if (/['-]/.test(roman)) s -= 4;
    // diaspora agents already bias — slight bump if countryFit text present
    if (n.countryFitEn && n.countryFitEn.length > 12) s += 4;
  }
  return clamp(s);
}

function keywordOverlap(hay: string, needles: string[]): number {
  const h = hay.toLowerCase();
  let hits = 0;
  for (const n of needles) {
    const token = n.toLowerCase().split(/\s+/)[0];
    if (token.length >= 4 && h.includes(token)) hits += 1;
  }
  return hits;
}

/** Heuristic horoscope fit from meaning/why vs persona traits. */
export function scoreHoroscopeHeuristic(
  n: SuggestedName,
  persona: HoroscopePersonaBrief | undefined,
): number {
  if (!persona) return 62;
  let s = 58;
  const bag = `${n.meaningEn} ${n.whyEn} ${n.meaningSi} ${n.whySi}`;
  s += keywordOverlap(bag, persona.traitsEn) * 8;
  s += keywordOverlap(bag, persona.nameToneEn) * 5;
  s += keywordOverlap(bag, persona.behaviourEn) * 4;
  // Soft bump if primary letter (chart-aligned)
  if (n.isPrimaryLetter) s += 6;
  return clamp(Math.min(92, s));
}

export function scoreMeaningLanguageHeuristic(
  n: SuggestedName,
  nameLanguage: NameLanguagePref,
): number {
  let s = 64;
  if (n.meaningEn.length >= 8) s += 8;
  if (n.meaningSi.length >= 4) s += 8;
  if (nameLanguage === "si") {
    if (n.first.sinhala.length >= 2) s += 10;
  }
  if (nameLanguage === "en") {
    if (/^[A-Za-z ]+$/.test(n.roman)) s += 10;
  }
  if (/^(—|-|\.)$/.test(n.meaningEn.trim())) s -= 20;
  return clamp(s);
}

export function scoreReligionHeuristic(
  n: SuggestedName,
  religion: ReligionContext,
): number {
  let s = 72;
  const bag = `${n.meaningEn} ${n.whyEn} ${n.roman}`.toLowerCase();
  if (religion === "secular" || religion === "interfaith") {
    // Prefer virtue meanings without heavy exclusive markers
    if (/\b(jesus|christ|allah|muhammad|buddha)\b/i.test(bag)) s -= 8;
    else s += 6;
  }
  if (religion === "buddhist" && /light|wisdom|compassion|සැනස|ප්‍රඥා|මෛත්‍රී/i.test(bag))
    s += 10;
  if (religion === "hindu" && /light|devotion|prosperity|ශක්ති|භක්ති/i.test(bag))
    s += 8;
  if (religion === "christian" && /grace|faith|hope|light|grace/i.test(bag))
    s += 8;
  if (religion === "islamic" && /peace|light|mercy|amin|noor/i.test(bag)) s += 8;
  return clamp(s);
}

export function compositeFromFactors(f: NameFactorScores): number {
  let sum = 0;
  let w = 0;
  for (const key of Object.keys(FACTOR_WEIGHTS) as (keyof NameFactorScores)[]) {
    sum += f[key] * FACTOR_WEIGHTS[key];
    w += FACTOR_WEIGHTS[key];
  }
  return clamp(sum / (w || 1));
}

export function applyDeterministicFactors(
  names: SuggestedName[],
  opts: {
    persona?: HoroscopePersonaBrief;
    country: LivingCountry;
    nameLanguage: NameLanguagePref;
    religion: ReligionContext;
  },
): SuggestedName[] {
  return names.map((n) => {
    const factors: NameFactorScores = {
      horoscopePersonalityFit: scoreHoroscopeHeuristic(n, opts.persona),
      readability: scoreReadability(n),
      memorability: scoreMemorability(n),
      modernGenerationFit: scoreModernHeuristic(n, opts.country),
      meaningLanguageFit: scoreMeaningLanguageHeuristic(n, opts.nameLanguage),
      religionFit: scoreReligionHeuristic(n, opts.religion),
      countryFit: scoreCountryHeuristic(n, opts.country),
    };
    const composite = compositeFromFactors(factors);
    // Blend with prior agent score (letter / agent judgment)
    const blended = clamp(Math.round(composite * 0.72 + (n.score || 70) * 0.28));
    return {
      ...n,
      factors,
      score: blended,
      alignWhyEn: n.alignWhyEn,
      alignWhySi: n.alignWhySi,
    };
  });
}

const FACTOR_LLM_CHUNK = 24;

async function refineFactorChunk(
  chunk: SuggestedName[],
  opts: {
    persona?: HoroscopePersonaBrief;
    country: LivingCountry;
    nameLanguage: NameLanguagePref;
    religion: ReligionContext;
    model: string;
  },
): Promise<Map<string, z.infer<typeof llmFactorSchema>["scores"][number]>> {
  const byRoman = new Map<
    string,
    z.infer<typeof llmFactorSchema>["scores"][number]
  >();
  if (!chunk.length) return byRoman;

  const payload = chunk.map((n) => ({
    roman: n.roman,
    sinhala: n.sinhala,
    meaningEn: n.meaningEn,
    meaningSi: n.meaningSi,
    whyEn: n.whyEn,
    agent: n.agentId,
  }));

  const prompt = `Score each baby name for Handahana Studio suitability.

HOROSCOPE PERSONA:
${opts.persona ? opts.persona.summaryEn : "No chart persona — use neutral mid scores (~60) for horoscopePersonalityFit."}

Living country: ${opts.country}
Name language preference: ${opts.nameLanguage}
Religion context: ${opts.religion}

For EACH name return 0–100:
- horoscopePersonalityFit: does meaning/sound suit the predicted temperament & behaviour?
- meaningLanguageFit: clear auspicious meaning in the preferred language(s)?
- religionFit: respectful of religion context (secular = no forced markers)?
- modernGenerationFit: feels current for young parents (not archaic-only)?

Also short alignWhyEn + alignWhySi (1 sentence each) explaining personality+meaning fit.

NAMES:
${JSON.stringify(payload)}

JSON only:
{"scores":[{"roman","horoscopePersonalityFit","meaningLanguageFit","religionFit","modernGenerationFit","alignWhyEn","alignWhySi"}]}`;

  try {
    const llm = new ChatOpenAI({
      model: opts.model,
      temperature: 0.2,
      apiKey: process.env.OPENAI_API_KEY,
      modelKwargs: { response_format: { type: "json_object" } },
    });
    const res = await llm.invoke([
      new SystemMessage(
        "You are the factor_align critic in a LangGraph naming harness. Output valid JSON only. Be fair and specific.",
      ),
      new HumanMessage(prompt),
    ]);
    const raw =
      typeof res.content === "string"
        ? res.content
        : JSON.stringify(res.content);
    const parsed = llmFactorSchema.parse(JSON.parse(raw));
    for (const s of parsed.scores) {
      byRoman.set(s.roman.trim().toLowerCase(), s);
    }
  } catch {
    /* keep deterministic scores for this chunk */
  }
  return byRoman;
}

/** Optional LLM refinement of semantic factors (chunked for any count). */
export async function refineFactorsWithLlm(
  names: SuggestedName[],
  opts: {
    persona?: HoroscopePersonaBrief;
    country: LivingCountry;
    nameLanguage: NameLanguagePref;
    religion: ReligionContext;
    model: string;
  },
): Promise<SuggestedName[]> {
  if (!names.length || !process.env.OPENAI_API_KEY) return names;

  const byRoman = new Map<
    string,
    z.infer<typeof llmFactorSchema>["scores"][number]
  >();
  for (let i = 0; i < names.length; i += FACTOR_LLM_CHUNK) {
    const chunk = names.slice(i, i + FACTOR_LLM_CHUNK);
    const part = await refineFactorChunk(chunk, opts);
    for (const [k, v] of part) byRoman.set(k, v);
  }

  return names.map((n) => {
    const hit = byRoman.get(n.roman.trim().toLowerCase());
    if (!hit || !n.factors) return n;
    const factors: NameFactorScores = {
      ...n.factors,
      horoscopePersonalityFit: clamp(hit.horoscopePersonalityFit),
      meaningLanguageFit: clamp(hit.meaningLanguageFit),
      religionFit: clamp(hit.religionFit),
      modernGenerationFit: clamp(
        hit.modernGenerationFit ?? n.factors.modernGenerationFit,
      ),
    };
    const composite = compositeFromFactors(factors);
    const blended = clamp(
      Math.round(composite * 0.75 + (n.score || 70) * 0.25),
    );
    return {
      ...n,
      factors,
      score: blended,
      alignWhyEn: hit.alignWhyEn || n.alignWhyEn,
      alignWhySi: hit.alignWhySi || n.alignWhySi,
    };
  });
}

export function sortByAlignment(names: SuggestedName[]): SuggestedName[] {
  return [...names].sort(
    (a, b) =>
      Number(b.isPrimaryLetter) - Number(a.isPrimaryLetter) ||
      Number(b.usageVerified) - Number(a.usageVerified) ||
      (b.factors?.horoscopePersonalityFit ?? 0) -
        (a.factors?.horoscopePersonalityFit ?? 0) ||
      b.score - a.score,
  );
}
