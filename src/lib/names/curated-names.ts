import { allowedNames, type NameRecord } from "./catalogue";
import { makePart, letterMatch } from "./name-pipeline";
import { scoreReadability } from "./readability";
import type { SuggestedName } from "./types";
import type { ReligionContext, LivingCountry } from "./personalities";
export type CuratedOptions = {
  firstLetters: string[];
  middleLetters: string[];
  primary: string;
  gender: string;
  religion?: ReligionContext;
  traditional?: boolean;
  includeReview?: boolean;
  count: number;
  excludePairs?: string[];
  excludeParts?: string[];
  letterSource: "chart" | "manual";
  country?: LivingCountry;
  variation?: number;
  fixedFirst?: string;
  fixedMiddle?: string;
};
export const pairKey = (s: string) =>
  s.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
// Positive endings are only a style bonus to existing records, never a generator of new words/meanings.
export function modernity(n: NameRecord) {
  const era = n.era === "modern" ? 88 : n.era === "timeless" ? 68 : 30;
  return Math.min(
    100,
    era +
      (/(?:eesh|ish|ith|th|yan|n|ra)$/i.test(n.roman) ? 6 : 0) +
      (n.syllables >= 2 && n.syllables <= 4 ? 4 : 0),
  );
}
export function curatedPair(
  first: NameRecord,
  middle: NameRecord,
  o: CuratedOptions,
): SuggestedName {
  const f = makePart(
    first.sinhala,
    first.roman,
    letterMatch(first.sinhala, first.roman, o.firstLetters)!,
    o.primary,
  );
  const m = makePart(
    middle.sinhala,
    middle.roman,
    letterMatch(middle.sinhala, middle.roman, o.middleLetters)!,
    o.primary,
  );
  const review =
    first.meaningStatus === "review" || middle.meaningStatus === "review";
  const base: SuggestedName = {
    sinhala: `${f.sinhala} ${m.sinhala}`,
    roman: `${f.roman} ${m.roman}`,
    first: f,
    middle: m,
    startsWith: f.startsWith,
    isPrimaryLetter: f.isPrimaryLetter,
    meaningSi: `${first.meaningSi} · ${middle.meaningSi}`,
    meaningEn: `${first.meaningEn} · ${middle.meaningEn}`,
    whySi:
      "ආරම්භක අකුරු, කියවීමේ පහසුව හා තෝරාගත් සංස්කෘතිය අනුව සංස්කරණය කළ ලැයිස්තුවකි.",
    whyEn:
      "Curated for starting letters, readability and your selected cultural preference.",
    familyFitSi:
      "පවුලේ රුචිය අනුව අවසන් තේරීම කරන්න; නමකින් පුද්ගලයාගේ ආගම තීරණය නොවේ.",
    familyFitEn:
      "Editorial compatibility tags are not a claim about anyone’s religion; your family decides.",
    countryFitSi: "සිංහල හා රෝමානු අක්ෂර දෙකෙන්ම නම පරීක්ෂා කරන්න.",
    countryFitEn: "Check both Sinhala and Roman spellings with your family.",
    agentId: "sinhala_language",
    agentLabelSi: "සංස්කරණය කළ නාම එකතුව",
    agentLabelEn: "Curated name catalogue",
    score: 0,
    letterSource: o.letterSource,
    usageVerified: false,
    usageNoteSi:
      "නවීනත්වය සංස්කාරක ඇගයීමකි; 2026 උපත් ජනප්‍රියතා සංඛ්‍යාලේඛනයක් නොවේ.",
    usageNoteEn:
      "Modernity is editorial; not verified 2026 newborn popularity.",
    religionTags: first.religions.filter((r) => middle.religions.includes(r))
      .length
      ? first.religions.filter((r) => middle.religions.includes(r))
      : o.religion === "interfaith"
        ? ["interfaith"]
        : [],
    era: first.era === middle.era ? first.era : "mixed",
    meaningStatus: review ? "review" : "sourced",
    meaningSources: [first.source, middle.source],
    meaningEvidence: [first, middle].map((n) => ({
      name: n.roman,
      basis:
        n.meaningBasis ??
        (n.meaningStatus === "review" ? "unverified" : "lexical"),
      sources: [n.source, ...(n.supportingSources ?? [])],
    })),
    catalogueIds: [first.id, middle.id],
    popularity: "editorial-unranked",
  };
  const readability = scoreReadability(base),
    modern = Math.round((modernity(first) + modernity(middle)) / 2);
  // Every accepted candidate already passes letter, gender and religion hard gates.
  const exact =
    o.primary &&
    first.sinhala.normalize("NFC").startsWith(o.primary.normalize("NFC"))
      ? 100
      : 80;
  base.score = Math.round(
    exact * 0.3 +
      modern * 0.3 +
      readability * 0.25 +
      100 * 0.15 -
      (review ? 15 : 0),
  );
  base.factors = {
    horoscopePersonalityFit: 0,
    readability,
    memorability: Math.max(
      0,
      100 - Math.abs(5 - first.syllables - middle.syllables) * 8,
    ),
    modernGenerationFit: modern,
    meaningLanguageFit: review ? 0 : 90,
    religionFit: 100,
    countryFit: 80,
  };
  return base;
}
export function curatedNames(o: CuratedOptions): SuggestedName[] {
  const firsts = allowedNames(
    o.firstLetters,
    o.gender,
    o.religion,
    o.traditional,
    o.includeReview,
  ).filter((n) => !o.fixedFirst || pairKey(n.roman) === pairKey(o.fixedFirst));
  const middles = allowedNames(
    o.middleLetters,
    o.gender,
    o.religion,
    o.traditional,
    o.includeReview,
  ).filter(
    (n) => !o.fixedMiddle || pairKey(n.roman) === pairKey(o.fixedMiddle),
  );
  const excluded = new Set((o.excludePairs ?? []).map(pairKey)),
    blocked = new Set((o.excludeParts ?? []).map(pairKey));
  // Keep only small candidate references while ranking. Building full narratives,
  // source arrays and score breakdowns for the Cartesian product wastes memory.
  type Candidate = {
    f: NameRecord;
    m: NameRecord;
    score: number;
    order: number;
  };
  const groups = new Map<string, Candidate[]>();
  const variation = o.variation ?? Math.random();
  function hash(s: string) {
    let h = Math.floor(variation * 0x7fffffff);
    for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return (h >>> 0) / 0xffffffff;
  }
  const compare = (a: Candidate, b: Candidate) =>
    b.order - a.order ||
    a.f.roman.localeCompare(b.f.roman) ||
    a.m.roman.localeCompare(b.m.roman);
  const limit = Math.min(200, Math.max(0, o.count));
  if (!limit) return [];
  const modern = new Map(
    [...firsts, ...middles].map((n) => [n.id, modernity(n)]),
  );
  for (const f of firsts) {
    if (blocked.has(pairKey(f.roman))) continue;
    const rows: Candidate[] = [];
    const exact =
      o.primary &&
      f.sinhala.normalize("NFC").startsWith(o.primary.normalize("NFC"))
        ? 100
        : 80;
    for (const m of middles) {
      if (
        f.id === m.id ||
        (f.variantGroup && f.variantGroup === m.variantGroup) ||
        blocked.has(pairKey(m.roman))
      )
        continue;
      const roman = `${f.roman} ${m.roman}`;
      if (excluded.has(pairKey(roman))) continue;
      const score = Math.round(
        exact * 0.3 +
          Math.round((modern.get(f.id)! + modern.get(m.id)!) / 2) * 0.3 +
          scoreReadability({ first: f, middle: m }) * 0.25 +
          15 -
          (f.meaningStatus === "review" || m.meaningStatus === "review"
            ? 15
            : 0),
      );
      rows.push({ f, m, score, order: score + hash(roman) * 4 });
    }
    if (!rows.length) continue;
    const key = f.variantGroup ?? f.id;
    const combined = [...(groups.get(key) ?? []), ...rows];
    combined.sort(compare);
    groups.set(key, combined.slice(0, limit));
  }
  // Round-robin across distinct first-name/variant groups before repeating one.
  const ordered = [...groups.values()].sort((a, b) => compare(a[0], b[0]));
  const result: SuggestedName[] = [];
  for (let round = 0; result.length < limit; round++) {
    let found = false;
    for (const rows of ordered)
      if (rows[round]) {
        const n = rows[round];
        result.push(curatedPair(n.f, n.m, o));
        found = true;
        if (result.length >= limit) break;
      }
    if (!found) break;
  }
  return result;
}
