/**
 * Smoke-test horoscope persona + multi-factor alignment (no OpenAI required).
 */
import { buildHoroscopePersona } from "../src/lib/names/horoscope-persona";
import {
  applyDeterministicFactors,
  compositeFromFactors,
  sortByAlignment,
} from "../src/lib/names/factor-align";
import { pairFallbackNames } from "../src/lib/names/name-pipeline";

const persona = buildHoroscopePersona({
  lagna: { rashi: "Leo", rashiSinhala: "සිංහ" },
  chandra: {
    rashi: "Scorpio",
    rashiSinhala: "වෘශ්චික",
    nekatha: "Anuradha",
    nekathaSpoken: "අනුරා",
    pada: 2,
  },
});

if (persona.lagnaRashi !== "Leo" || !persona.traitsEn.length) {
  throw new Error("persona build failed");
}
if (!persona.summaryEn.includes("Lagna Leo")) {
  throw new Error("persona summary missing lagna");
}

const raw = pairFallbackNames(
  ["ම", "මො"],
  ["ර", "රා"],
  "මො",
  "male",
  10,
  "athurudaya",
  "lk",
  "chart",
);

const scored = sortByAlignment(
  applyDeterministicFactors(raw, {
    persona,
    country: "lk",
    nameLanguage: "bilingual",
    religion: "buddhist",
  }),
);

if (!scored.length) throw new Error("no scored names");
if (!scored.every((n) => n.factors)) throw new Error("missing factors");

for (const n of scored) {
  const c = compositeFromFactors(n.factors!);
  if (c < 0 || c > 100) throw new Error(`bad composite ${c}`);
  for (const v of Object.values(n.factors!)) {
    if (v < 0 || v > 100) throw new Error(`factor OOB ${v}`);
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      persona: {
        lagna: persona.lagnaRashi,
        nekatha: persona.nekatha,
        tones: persona.nameToneEn.slice(0, 3),
      },
      top: scored.slice(0, 3).map((n) => ({
        roman: n.roman,
        score: n.score,
        horoscope: n.factors!.horoscopePersonalityFit,
        readability: n.factors!.readability,
        memorability: n.factors!.memorability,
        modern: n.factors!.modernGenerationFit,
        meaning: n.factors!.meaningLanguageFit,
        religion: n.factors!.religionFit,
        country: n.factors!.countryFit,
      })),
    },
    null,
    2,
  ),
);
