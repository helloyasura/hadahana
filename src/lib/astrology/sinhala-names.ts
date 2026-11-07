/** Sinhala / rural Handahana labels for rashi, graha, and bhava. */

export const RASHI: Record<
  string,
  { sinhala: string; spoken: string; lord: string; element: string }
> = {
  Aries: { sinhala: "මේෂ", spoken: "මේෂ", lord: "Mars", element: "Fire" },
  Taurus: { sinhala: "වෘෂභ", spoken: "වෘෂභ", lord: "Venus", element: "Earth" },
  Gemini: { sinhala: "මිථුන", spoken: "මිථුන", lord: "Mercury", element: "Air" },
  Cancer: { sinhala: "කටක", spoken: "කටක", lord: "Moon", element: "Water" },
  Leo: { sinhala: "සිංහ", spoken: "සිංහ", lord: "Sun", element: "Fire" },
  Virgo: { sinhala: "කන්‍යා", spoken: "කන්‍යා", lord: "Mercury", element: "Earth" },
  Libra: { sinhala: "තුලා", spoken: "තුලා", lord: "Venus", element: "Air" },
  Scorpio: {
    sinhala: "වෘශ්චික",
    spoken: "වෘශ්චික",
    lord: "Mars",
    element: "Water",
  },
  Sagittarius: {
    sinhala: "ධනු",
    spoken: "ධනු",
    lord: "Jupiter",
    element: "Fire",
  },
  Capricorn: {
    sinhala: "මකර",
    spoken: "මකර",
    lord: "Saturn",
    element: "Earth",
  },
  Aquarius: {
    sinhala: "කුම්භ",
    spoken: "කුම්භ",
    lord: "Saturn",
    element: "Air",
  },
  Pisces: { sinhala: "මීන", spoken: "මීන", lord: "Jupiter", element: "Water" },
};

export const GRAHA: Record<
  string,
  { sinhala: string; spoken: string; nature: "benefic" | "malefic" | "mixed" }
> = {
  Sun: { sinhala: "සූර්ය", spoken: "රවි", nature: "malefic" },
  Moon: { sinhala: "චන්ද්‍ර", spoken: "සඳ", nature: "benefic" },
  Mars: { sinhala: "කුජ", spoken: "අඟහරු", nature: "malefic" },
  Mercury: { sinhala: "බුධ", spoken: "බුධ", nature: "mixed" },
  Jupiter: { sinhala: "ගුරු", spoken: "බ්‍රහස්පති", nature: "benefic" },
  Venus: { sinhala: "ශුක්‍ර", spoken: "සිකුරු", nature: "benefic" },
  Saturn: { sinhala: "ශනි", spoken: "සෙනසුරු", nature: "malefic" },
  Rahu: { sinhala: "රාහු", spoken: "රාහු", nature: "malefic" },
  Ketu: { sinhala: "කේතු", spoken: "කේතු", nature: "malefic" },
};

export const BHAVA: Record<
  number,
  { sanskrit: string; sinhala: string; themes: string }
> = {
  1: {
    sanskrit: "Lagna / Tanu",
    sinhala: "ලග්න / තනු භාව",
    themes: "body, temperament, life path, birth circumstances",
  },
  2: {
    sanskrit: "Dhana",
    sinhala: "ධන භාව",
    themes: "wealth, family speech, food, early resources",
  },
  3: {
    sanskrit: "Sahaja",
    sinhala: "සහජ භාව",
    themes: "siblings, courage, short journeys, effort",
  },
  4: {
    sanskrit: "Sukha",
    sinhala: "සුඛ භාව",
    themes: "mother, home, vehicles, inner peace, early education",
  },
  5: {
    sanskrit: "Putra",
    sinhala: "පුත්‍ර භාව",
    themes: "children, intelligence, creativity, devotion",
  },
  6: {
    sanskrit: "Ripu / Roga",
    sinhala: "රිපු / රෝග භාව",
    themes: "health challenges, enemies, service, debts",
  },
  7: {
    sanskrit: "Kalatra",
    sinhala: "කලත්‍ර භාව",
    themes: "marriage, partnerships, public dealings",
  },
  8: {
    sanskrit: "Ayur / Randhra",
    sinhala: "ආයුර් / රන්ධ්‍ර භාව",
    themes: "longevity, transformation, hidden matters, inheritance",
  },
  9: {
    sanskrit: "Dharma",
    sinhala: "ධර්ම භාව",
    themes: "father, fortune, higher learning, long travel, dharma",
  },
  10: {
    sanskrit: "Karma",
    sinhala: "කර්ම භාව",
    themes: "career, status, public reputation",
  },
  11: {
    sanskrit: "Labha",
    sinhala: "ලාභ භාව",
    themes: "gains, friends, fulfilled hopes, elder siblings",
  },
  12: {
    sanskrit: "Vyaya",
    sinhala: "ව්‍යය භාව",
    themes: "expenses, foreign lands, loss, moksha / liberation",
  },
};

export function rashiLabel(english: string): {
  english: string;
  sinhala: string;
  spoken: string;
  lord: string;
  element: string;
} {
  const hit = RASHI[english];
  if (!hit) {
    return {
      english,
      sinhala: english,
      spoken: english,
      lord: "?",
      element: "?",
    };
  }
  return { english, ...hit };
}

export function grahaLabel(english: string): {
  english: string;
  sinhala: string;
  spoken: string;
  nature: string;
} {
  const hit = GRAHA[english];
  if (!hit) {
    return { english, sinhala: english, spoken: english, nature: "mixed" };
  }
  return { english, ...hit };
}
