/** Dependency-free readability scoring shared by curated and legacy paths. */
function vowelDensity(roman: string): number {
  const letters = roman.replace(/[^a-zA-Z]/g, "");
  if (!letters.length) return 0.4;
  const vowels = (letters.match(/[aeiouAEIOU]/g) || []).length;
  return vowels / letters.length;
}

/** Deterministic readability: length, vowel mix, awkward clusters. */
export function scoreReadability(n: {
  first: { roman: string; sinhala: string };
  middle: { roman: string; sinhala: string };
}): number {
  const full = `${n.first.roman} ${n.middle.roman}`;
  const len = full.replace(/\s/g, "").length;
  let s = 72;
  if (len >= 8 && len <= 16) s += 12;
  else if (len >= 6 && len <= 20) s += 6;
  else if (len > 24) s -= 18;
  else if (len < 5) s -= 10;

  const vd = vowelDensity(full);
  if (vd >= 0.28 && vd <= 0.55) s += 10;
  else if (vd < 0.18 || vd > 0.7) s -= 12;

  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(full)) s -= 15;
  if (n.first.sinhala.length >= 2 && n.middle.sinhala.length >= 2) s += 4;
  return Math.min(100, Math.max(0, Math.round(s)));
}
