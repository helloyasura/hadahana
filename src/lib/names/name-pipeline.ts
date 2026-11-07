/**
 * Shared letter guards, seed fallback, and critic merge used by
 * both the legacy path and the LangGraph naming harness.
 */

import { z } from "zod";
import type { BirthInput } from "@/lib/astrology/kendraya";
import { seedsForLetters, aksharaKey } from "@/lib/names/seed-pool";
import {
  nameMatchesLetter,
  sinhalaBaseAkshara,
} from "@/lib/names/sinhala-base";
import {
  INTERESTS,
  LIVING_COUNTRIES,
  NAME_LANGUAGE_OPTIONS,
  RELIGION_OPTIONS,
  type InterestId,
  type LivingCountry,
  type NameLanguagePref,
  type NamingPersonalityId,
  type ReligionContext,
  personalityById,
} from "@/lib/names/personalities";
import type { LetterSource, NamePart, SuggestedName } from "@/lib/names/types";

export const namePartSchema = z.object({
  sinhala: z.string(),
  roman: z.string(),
  startsWith: z.string(),
});

export const nameItemSchema = z.object({
  first: namePartSchema,
  middle: namePartSchema,
  meaningSi: z.string(),
  meaningEn: z.string(),
  whySi: z.string(),
  whyEn: z.string(),
  familyFitSi: z.string(),
  familyFitEn: z.string(),
  countryFitSi: z.string().optional(),
  countryFitEn: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
});

export const nameResponseSchema = z.object({
  names: z.array(nameItemSchema),
});

export function religionLabel(id?: ReligionContext): string {
  const row = RELIGION_OPTIONS.find((r) => r.id === (id ?? "unspecified"));
  return row ? `${row.si} / ${row.en}` : "unspecified";
}

export function languageLabel(id?: NameLanguagePref): string {
  const row = NAME_LANGUAGE_OPTIONS.find((r) => r.id === (id ?? "bilingual"));
  return row ? `${row.si} / ${row.en}` : "bilingual";
}

export function interestLabel(ids?: InterestId[]) {
  return (ids ?? [])
    .map((id) => INTERESTS.find((i) => i.id === id))
    .filter(Boolean)
    .map((i) => `${i!.si} / ${i!.en}`)
    .join("; ");
}

export function letterMatch(
  nameSi: string,
  nameRoman: string,
  letters: string[],
): string | null {
  const n = aksharaKey(nameSi);
  const sorted = [...letters].sort((a, b) => b.length - a.length);
  for (const L of sorted) {
    const key = aksharaKey(L);
    if (n.startsWith(key)) return key;
  }
  for (const L of sorted) {
    if (nameMatchesLetter(nameSi, nameRoman, L)) {
      const base = sinhalaBaseAkshara(L);
      if (
        base &&
        n.startsWith(base) &&
        letters.some((x) => aksharaKey(x) === base)
      ) {
        return base;
      }
      return aksharaKey(L);
    }
  }
  return null;
}

export function resolvePartStart(
  part: { sinhala: string; roman: string; startsWith: string },
  letters: string[],
): string | null {
  const start = letterMatch(part.sinhala, part.roman, letters);
  if (start) return start;
  const claimed = aksharaKey(part.startsWith);
  if (
    letters.some((L) => aksharaKey(L) === claimed) &&
    nameMatchesLetter(part.sinhala, part.roman, claimed)
  ) {
    return claimed;
  }
  for (const L of letters) {
    if (
      sinhalaBaseAkshara(L) === claimed &&
      nameMatchesLetter(part.sinhala, part.roman, L)
    ) {
      return claimed;
    }
  }
  return null;
}

function isPrimaryOrBase(
  startsWith: string,
  primary: string,
  nameSi: string,
): boolean {
  const p = aksharaKey(primary);
  const s = aksharaKey(startsWith);
  if (s === p || nameSi.startsWith(p)) return true;
  const base = sinhalaBaseAkshara(p);
  return Boolean(base && (s === base || nameSi.startsWith(base)));
}

export function makePart(
  sinhala: string,
  roman: string,
  startsWith: string,
  primary: string,
): NamePart {
  return {
    sinhala,
    roman,
    startsWith,
    isPrimaryLetter: isPrimaryOrBase(startsWith, primary, sinhala),
  };
}

const SURNAME_BLOCK = new Set(
  ["perera", "silva", "fernando", "jayawardena", "bandara", "gunawardena"].map(
    (s) => s.toLowerCase(),
  ),
);

export function pairFallbackNames(
  firstLetters: string[],
  middleLetters: string[],
  primary: string,
  gender: BirthInput["gender"],
  count: number,
  agentId: NamingPersonalityId,
  country: LivingCountry,
  letterSource: LetterSource,
): SuggestedName[] {
  const agent = personalityById(agentId);
  const g =
    gender === "male" || gender === "female" ? gender : "unspecified";
  const firstSeeds = seedsForLetters(firstLetters, g);
  const middleSeeds = seedsForLetters(
    middleLetters.length ? middleLetters : firstLetters,
    g,
  );
  const countryMeta = LIVING_COUNTRIES.find((c) => c.id === country)!;
  const out: SuggestedName[] = [];
  const seen = new Set<string>();
  const firstPool = firstSeeds.length ? firstSeeds : [];
  const middlePool = middleSeeds.length ? middleSeeds : firstSeeds;
  if (!firstPool.length || !middlePool.length) return out;

  // Cycle first×middle pairs until we hit the requested count (or exhaust unique pairs).
  const maxUnique = firstPool.length * Math.max(middlePool.length - 1, 1);
  const target = Math.max(1, count);
  for (let i = 0; out.length < target && i < Math.max(target * 4, maxUnique * 2); i++) {
    const first = firstPool[i % firstPool.length];
    const middle =
      middlePool[(i + 1 + Math.floor(i / firstPool.length)) % middlePool.length];
    if (!middle || middle.roman.toLowerCase() === first.roman.toLowerCase()) {
      continue;
    }
    const key = `${first.roman}|${middle.roman}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const firstStart =
      letterMatch(first.sinhala, first.roman, firstLetters) ?? first.startsWith;
    const midLetters = middleLetters.length ? middleLetters : firstLetters;
    const middleStart =
      letterMatch(middle.sinhala, middle.roman, midLetters) ?? middle.startsWith;
    const firstPart = makePart(first.sinhala, first.roman, firstStart, primary);
    const middlePart = makePart(
      middle.sinhala,
      middle.roman,
      middleStart,
      primary,
    );
    out.push({
      sinhala: `${firstPart.sinhala} ${middlePart.sinhala}`,
      roman: `${firstPart.roman} ${middlePart.roman}`,
      first: firstPart,
      middle: middlePart,
      startsWith: firstStart,
      isPrimaryLetter: firstPart.isPrimaryLetter,
      meaningSi: `${first.meaningSi} · ${middle.meaningSi}`,
      meaningEn: `${first.meaningEn} · ${middle.meaningEn}`,
      whySi: `${agent.si}: මුල් නම ${firstStart}, මධ්‍ය නම ${middleStart}.`,
      whyEn: `${agent.en}: first ${firstStart}, middle ${middleStart}.`,
      familyFitSi: "නවීන සිංහල නාම රටාවකි (මුල් + මධ්‍ය).",
      familyFitEn: "Modern Sinhala first + middle pattern.",
      countryFitSi: `${countryMeta.si} ජීවිතයට ගැලපෙන රෝමානු ආකාරය.`,
      countryFitEn: `Roman forms usable in ${countryMeta.en}.`,
      agentId: agent.id,
      agentLabelSi: agent.si,
      agentLabelEn: agent.en,
      score: firstPart.isPrimaryLetter ? 86 : 70,
      letterSource,
    });
  }
  return out;
}

export function criticMerge(
  batches: SuggestedName[],
  primary: string,
  firstLetters: string[],
  middleLetters: string[],
  count: number,
): SuggestedName[] {
  const byKey = new Map<string, SuggestedName>();
  for (const n of batches) {
    if (
      SURNAME_BLOCK.has(n.first.roman.trim().toLowerCase()) ||
      SURNAME_BLOCK.has(n.middle.roman.trim().toLowerCase())
    ) {
      continue;
    }
    const firstStart =
      letterMatch(n.first.sinhala, n.first.roman, firstLetters) ??
      (firstLetters.includes(n.first.startsWith) ? n.first.startsWith : null);
    const middleStart =
      letterMatch(n.middle.sinhala, n.middle.roman, middleLetters) ??
      (middleLetters.includes(n.middle.startsWith)
        ? n.middle.startsWith
        : null);
    if (!firstStart || !middleStart) continue;
    const key = `${n.first.roman}|${n.middle.roman}`.toLowerCase();
    const first = makePart(
      n.first.sinhala,
      n.first.roman,
      firstStart,
      primary,
    );
    const middle = makePart(
      n.middle.sinhala,
      n.middle.roman,
      middleStart,
      primary,
    );
    const next: SuggestedName = {
      ...n,
      first,
      middle,
      sinhala: `${first.sinhala} ${middle.sinhala}`,
      roman: `${first.roman} ${middle.roman}`,
      startsWith: firstStart,
      isPrimaryLetter: first.isPrimaryLetter,
    };
    const prev = byKey.get(key);
    if (!prev || next.score > prev.score) byKey.set(key, next);
  }
  const cleaned = [...byKey.values()];
  cleaned.sort(
    (a, b) =>
      Number(b.isPrimaryLetter) - Number(a.isPrimaryLetter) ||
      b.score - a.score ||
      a.roman.localeCompare(b.roman),
  );
  return cleaned.slice(0, count);
}
