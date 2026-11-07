/**
 * Sinhala naming rule: a vowel-marked chart letter (e.g. මො)
 * also permits the bare base consonant (ම).
 */

/** Normalize Sinhala / roman letter tokens. */
export function aksharaKey(s: string): string {
  return s.trim().normalize("NFC");
}

/** Dependent vowels, virama, and length marks used after a consonant. */
const SINHALA_PILI =
  /[\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u200D]/g;

/**
 * Base consonant (or independent vowel) of a Sinhala syllable.
 * මො → ම, මෝ → ම, ති → ත, පෙ → ප, අ → අ
 */
export function sinhalaBaseAkshara(syllable: string): string {
  const s = aksharaKey(syllable);
  if (!s) return s;
  const stripped = s.replace(SINHALA_PILI, "");
  const chars = [...stripped];
  return chars[0] ?? s;
}

/** True when `letter` is a vowel-marked form of `base` (same consonant + pili). */
export function isVowelMarkedOf(letter: string, base: string): boolean {
  const L = aksharaKey(letter);
  const B = aksharaKey(base);
  if (!L || !B || L === B) return false;
  return sinhalaBaseAkshara(L) === B && L.startsWith(B);
}

/**
 * Expand allowed starting letters so each vowel-marked akshara
 * also includes its base consonant (මො → මො, ම).
 */
export function expandLettersWithBase(letters: string[]): string[] {
  const out: string[] = [];
  for (const raw of letters) {
    const L = aksharaKey(raw);
    if (!L) continue;
    if (!out.includes(L)) out.push(L);
    const base = sinhalaBaseAkshara(L);
    if (base && base !== L && !out.includes(base)) out.push(base);
  }
  return out;
}

/**
 * Roman phonetic starts accepted for a Sinhala letter / its base.
 * මො/මෝ → mo… ; ම → any ma/mi/mu/me/mo… (leading "m")
 */
export function romanPrefixesForLetter(letterSi: string): string[] {
  const L = aksharaKey(letterSi);
  const base = sinhalaBaseAkshara(L);
  const prefixes: string[] = [];
  if (L === "මො" || L === "මෝ") prefixes.push("mo");
  if (L === "නො" || L === "නෝ") prefixes.push("no");
  if (L === "තො" || L === "තෝ") prefixes.push("tho", "to");
  if (L === "කො" || L === "කෝ") prefixes.push("ko");
  if (L === "රො" || L === "රෝ") prefixes.push("ro");
  if (L === "සො" || L === "සෝ") prefixes.push("so");
  if (L === "පො" || L === "පෝ") prefixes.push("po");
  if (L === "බො" || L === "බෝ") prefixes.push("bo");
  if (L === "දො" || L === "දෝ") prefixes.push("do");
  if (L === "ගො" || L === "ගෝ") prefixes.push("go");
  // Base consonant → single-letter roman onset
  const baseRoman: Record<string, string> = {
    ම: "m",
    න: "n",
    ත: "th",
    ට: "t",
    ක: "k",
    ර: "r",
    ස: "s",
    ප: "p",
    බ: "b",
    ද: "d",
    ග: "g",
    ච: "ch",
    ජ: "j",
    ල: "l",
    ව: "v",
    හ: "h",
    ය: "y",
    ශ: "sh",
    ෂ: "sh",
    ෆ: "f",
  };
  if (baseRoman[base]) prefixes.push(baseRoman[base]);
  if (baseRoman[L]) prefixes.push(baseRoman[L]);
  return [...new Set(prefixes.filter(Boolean))];
}

export function nameMatchesLetter(
  nameSi: string,
  nameRoman: string,
  letterSi: string,
): boolean {
  const L = aksharaKey(letterSi);
  const n = aksharaKey(nameSi);
  if (n.startsWith(L)) return true;
  const base = sinhalaBaseAkshara(L);
  if (base !== L && n.startsWith(base)) {
    // Name uses base or another pili on same consonant (ම, මා, මි…)
    // Allow when the selected letter is vowel-marked (මො) or is the base itself.
    return true;
  }
  const roman = nameRoman.trim().toLowerCase();
  return romanPrefixesForLetter(L).some((p) => roman.startsWith(p));
}
