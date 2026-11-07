/**
 * Nakath Akshara (නැකැත් අක්ෂර) — 108 pada syllables for Nam Thebima.
 * Sources aligned with traditional Sri Lankan / Jyotisha naming tables
 * (GoodVibes LK, classical pada syllable lists). Phonetic sound matters,
 * not Latin spelling.
 */

export type NakathPada = {
  roman: string;
  sinhala: string;
};

export type NekathaRow = {
  index: number;
  english: string;
  sinhala: string;
  /** Common rural / spoken Sinhala form */
  spoken: string;
  lord: string;
  padas: [NakathPada, NakathPada, NakathPada, NakathPada];
};

/** Degrees of zodiac per nakshatra (13°20′) and per pada (3°20′). */
export const NAKSHATRA_SPAN = 360 / 27;
export const PADA_SPAN = NAKSHATRA_SPAN / 4;

export const NEKATHA_TABLE: NekathaRow[] = [
  {
    index: 1,
    english: "Ashwini",
    sinhala: "අශ්විනී",
    spoken: "අස්විද",
    lord: "Ketu",
    // Sinhala forms follow Laksara SL table (short vowels where listed).
    padas: [
      { roman: "Chu", sinhala: "චු" },
      { roman: "Che", sinhala: "චෙ" },
      { roman: "Cho", sinhala: "චො" },
      { roman: "La", sinhala: "ල" },
    ],
  },
  {
    index: 2,
    english: "Bharani",
    sinhala: "භරණී",
    spoken: "බෙරණ",
    lord: "Venus",
    padas: [
      { roman: "Li", sinhala: "ලි" },
      { roman: "Lu", sinhala: "ලු" },
      { roman: "Le", sinhala: "ලෙ" },
      { roman: "Lo", sinhala: "ලො" },
    ],
  },
  {
    index: 3,
    english: "Krittika",
    sinhala: "කෘත්තිකා",
    spoken: "කැති",
    lord: "Sun",
    padas: [
      { roman: "A", sinhala: "අ" },
      { roman: "I", sinhala: "ඉ" },
      { roman: "U", sinhala: "උ" },
      { roman: "E", sinhala: "එ" },
    ],
  },
  {
    index: 4,
    english: "Rohini",
    sinhala: "රෝහිණී",
    spoken: "රෙහෙණ",
    lord: "Moon",
    padas: [
      { roman: "O", sinhala: "ඔ" },
      { roman: "Va", sinhala: "ව" },
      { roman: "Vi", sinhala: "වි" },
      { roman: "Vu", sinhala: "වු" },
    ],
  },
  {
    index: 5,
    english: "Mrigashira",
    sinhala: "මෘගශිරස්",
    spoken: "මුවසිරස",
    lord: "Mars",
    padas: [
      { roman: "Ve", sinhala: "වෙ" },
      { roman: "Vo", sinhala: "වො" },
      { roman: "Ka", sinhala: "ක" },
      { roman: "Ki", sinhala: "කි" },
    ],
  },
  {
    index: 6,
    english: "Ardra",
    sinhala: "ආර්ද්‍රා",
    spoken: "අද",
    lord: "Rahu",
    padas: [
      { roman: "Ku", sinhala: "කු" },
      { roman: "Gha", sinhala: "ඝ" },
      { roman: "Nga", sinhala: "ඞ" },
      { roman: "Chha", sinhala: "ඡ" },
    ],
  },
  {
    index: 7,
    english: "Punarvasu",
    sinhala: "පුනර්වසු",
    spoken: "පුනාවස",
    lord: "Jupiter",
    padas: [
      { roman: "Ke", sinhala: "කෙ" },
      { roman: "Ko", sinhala: "කො" },
      { roman: "Ha", sinhala: "හ" },
      { roman: "Hi", sinhala: "හි" },
    ],
  },
  {
    index: 8,
    english: "Pushya",
    sinhala: "පුෂ්‍ය",
    spoken: "පුස",
    lord: "Saturn",
    padas: [
      { roman: "Hu", sinhala: "හු" },
      { roman: "He", sinhala: "හෙ" },
      { roman: "Ho", sinhala: "හො" },
      { roman: "Da", sinhala: "ඩ" },
    ],
  },
  {
    index: 9,
    english: "Ashlesha",
    sinhala: "ආශ්ලේෂා",
    spoken: "ආස්ලිස",
    lord: "Mercury",
    padas: [
      { roman: "Di", sinhala: "ඩි" },
      { roman: "Du", sinhala: "ඩු" },
      { roman: "De", sinhala: "ඩෙ" },
      { roman: "Do", sinhala: "ඩො" },
    ],
  },
  {
    index: 10,
    english: "Magha",
    sinhala: "මඝා",
    spoken: "මා",
    lord: "Ketu",
    padas: [
      { roman: "Ma", sinhala: "ම" },
      { roman: "Mi", sinhala: "මි" },
      { roman: "Mu", sinhala: "මු" },
      { roman: "Me", sinhala: "මෙ" },
    ],
  },
  {
    index: 11,
    english: "Purva Phalguni",
    sinhala: "පූර්ව ඵල්ගුණී",
    spoken: "පුබා",
    lord: "Venus",
    padas: [
      { roman: "Mo", sinhala: "මො" },
      { roman: "Ta", sinhala: "ට" },
      { roman: "Ti", sinhala: "ටි" },
      { roman: "Tu", sinhala: "ටු" },
    ],
  },
  {
    index: 12,
    english: "Uttara Phalguni",
    sinhala: "උත්තර ඵල්ගුණී",
    spoken: "උත්‍රපල්",
    lord: "Sun",
    padas: [
      { roman: "Te", sinhala: "ටෙ" },
      { roman: "To", sinhala: "ටො" },
      { roman: "Pa", sinhala: "ප" },
      { roman: "Pi", sinhala: "පි" },
    ],
  },
  {
    index: 13,
    english: "Hasta",
    sinhala: "හස්ත",
    spoken: "හත",
    lord: "Moon",
    padas: [
      { roman: "Pu", sinhala: "පු" },
      { roman: "Sha", sinhala: "ෂ" },
      { roman: "Na", sinhala: "ණ" },
      { roman: "Tha", sinhala: "ඨ" },
    ],
  },
  {
    index: 14,
    english: "Chitra",
    sinhala: "චිත්‍රා",
    spoken: "සිත",
    lord: "Mars",
    padas: [
      { roman: "Pe", sinhala: "පෙ" },
      { roman: "Po", sinhala: "පො" },
      { roman: "Ra", sinhala: "ර" },
      { roman: "Ri", sinhala: "රි" },
    ],
  },
  {
    index: 15,
    english: "Swati",
    sinhala: "ස්වාති",
    spoken: "සා",
    lord: "Rahu",
    padas: [
      { roman: "Ru", sinhala: "රු" },
      { roman: "Re", sinhala: "රෙ" },
      { roman: "Ro", sinhala: "රො" },
      { roman: "Ta", sinhala: "ත" },
    ],
  },
  {
    index: 16,
    english: "Vishakha",
    sinhala: "විශාඛා",
    spoken: "විසා",
    lord: "Jupiter",
    padas: [
      { roman: "Ti", sinhala: "ති" },
      { roman: "Tu", sinhala: "තු" },
      { roman: "Te", sinhala: "තෙ" },
      { roman: "To", sinhala: "තො" },
    ],
  },
  {
    index: 17,
    english: "Anuradha",
    sinhala: "අනුරාධා",
    spoken: "අනුර",
    lord: "Saturn",
    padas: [
      { roman: "Na", sinhala: "න" },
      { roman: "Ni", sinhala: "නි" },
      { roman: "Nu", sinhala: "නු" },
      { roman: "Ne", sinhala: "නෙ" },
    ],
  },
  {
    index: 18,
    english: "Jyeshtha",
    sinhala: "ජ්‍යේෂ්ඨා",
    spoken: "දෙට",
    lord: "Mercury",
    padas: [
      { roman: "No", sinhala: "නො" },
      { roman: "Ya", sinhala: "ය" },
      { roman: "Yi", sinhala: "යි" },
      { roman: "Yu", sinhala: "යු" },
    ],
  },
  {
    index: 19,
    english: "Mula",
    sinhala: "මූල",
    spoken: "මුල",
    lord: "Ketu",
    padas: [
      { roman: "Ye", sinhala: "යෙ" },
      { roman: "Yo", sinhala: "යො" },
      { roman: "Ba", sinhala: "බ" },
      { roman: "Bi", sinhala: "බි" },
    ],
  },
  {
    index: 20,
    english: "Purva Ashadha",
    sinhala: "පූර්වාෂාඪා",
    spoken: "පුවසල",
    lord: "Venus",
    padas: [
      { roman: "Bu", sinhala: "බු" },
      { roman: "Dha", sinhala: "ධ" },
      { roman: "E", sinhala: "එ" },
      { roman: "Dda", sinhala: "ඪ" },
    ],
  },
  {
    index: 21,
    english: "Uttara Ashadha",
    sinhala: "උත්තරාෂාඪා",
    spoken: "උත්‍රසල",
    lord: "Sun",
    padas: [
      { roman: "Be", sinhala: "බෙ" },
      { roman: "Bo", sinhala: "බො" },
      { roman: "Ja", sinhala: "ජ" },
      { roman: "Ji", sinhala: "ජි" },
    ],
  },
  {
    index: 22,
    english: "Shravana",
    sinhala: "ශ්‍රවණ",
    spoken: "සුවණ",
    lord: "Moon",
    // Laksara SL line (Ju/Je/Jo/Sha). Alternate Khi-line exists in some tables.
    padas: [
      { roman: "Ju", sinhala: "ජු" },
      { roman: "Je", sinhala: "ජෙ" },
      { roman: "Jo", sinhala: "ජො" },
      { roman: "Sha", sinhala: "ෂ" },
    ],
  },
  {
    index: 23,
    english: "Dhanishta",
    sinhala: "ධනිෂ්ඨා",
    spoken: "දෙනට",
    lord: "Mars",
    padas: [
      { roman: "Ga", sinhala: "ග" },
      { roman: "Gi", sinhala: "ගි" },
      { roman: "Gu", sinhala: "ගු" },
      { roman: "Ge", sinhala: "ගෙ" },
    ],
  },
  {
    index: 24,
    english: "Shatabhisha",
    sinhala: "ශතභිෂා",
    spoken: "සියාවස",
    lord: "Rahu",
    padas: [
      { roman: "Go", sinhala: "ගො" },
      { roman: "Sa", sinhala: "ස" },
      { roman: "Si", sinhala: "සි" },
      { roman: "Su", sinhala: "සු" },
    ],
  },
  {
    index: 25,
    english: "Purva Bhadrapada",
    sinhala: "පූර්ව භාද්‍රපදා",
    spoken: "පුවපුටුප",
    lord: "Jupiter",
    padas: [
      { roman: "Se", sinhala: "සෙ" },
      { roman: "So", sinhala: "සො" },
      { roman: "Da", sinhala: "ද" },
      { roman: "Di", sinhala: "දි" },
    ],
  },
  {
    index: 26,
    english: "Uttara Bhadrapada",
    sinhala: "උත්තර භාද්‍රපදා",
    spoken: "උත්‍රපුටුප",
    lord: "Saturn",
    padas: [
      { roman: "Du", sinhala: "දු" },
      { roman: "Tha", sinhala: "ථ" },
      { roman: "Jha", sinhala: "ඣ" },
      { roman: "Nya", sinhala: "ඤ" },
    ],
  },
  {
    index: 27,
    english: "Revati",
    sinhala: "රේවතී",
    spoken: "රේවතී",
    lord: "Mercury",
    padas: [
      { roman: "De", sinhala: "දෙ" },
      { roman: "Do", sinhala: "දො" },
      { roman: "Cha", sinhala: "ච" },
      { roman: "Chi", sinhala: "චි" },
    ],
  },
];

/** 9-fold Tara classes counted from Janma nekatha. */
export const TARA_CLASSES = [
  { key: "janma", sinhala: "ජන්ම", favourForNaming: true },
  { key: "sampath", sinhala: "සම්පත්", favourForNaming: true },
  { key: "vipath", sinhala: "විපත්", favourForNaming: false },
  { key: "kshema", sinhala: "ක්ෂේම", favourForNaming: true },
  { key: "pratyari", sinhala: "ප්‍රත්‍යාරි", favourForNaming: false },
  { key: "sadhaka", sinhala: "සාධක", favourForNaming: true },
  { key: "vadha", sinhala: "වධ", favourForNaming: false },
  { key: "maitri", sinhala: "මෛත්‍රී", favourForNaming: true },
  { key: "parama_maitri", sinhala: "පරම මෛත්‍රී", favourForNaming: true },
] as const;

export function taraCycleFromJanma(janmaIndex: number) {
  return TARA_CLASSES.map((cls, offset) => {
    const index = ((janmaIndex - 1 + offset) % 27) + 1;
    const row = NEKATHA_TABLE[index - 1];
    return {
      offset,
      classKey: cls.key,
      classSinhala: cls.sinhala,
      favourForNaming: cls.favourForNaming,
      nekathaIndex: index,
      english: row.english,
      spoken: row.spoken,
      syllables: row.padas,
    };
  });
}

export function namingLetterSet(englishName: string, pada: number) {
  const primary = aksharaFor(englishName, pada);
  const tara = taraCycleFromJanma(primary.nekatha.index);
  const favour = tara.filter((t) => t.favourForNaming);
  const avoid = tara.filter((t) => !t.favourForNaming);
  const secondarySyllables = favour
    .filter((t) => t.offset !== 0)
    .flatMap((t) =>
      t.syllables.map((s) => ({
        roman: s.roman,
        sinhala: s.sinhala,
        fromNekatha: t.spoken,
        classKey: t.classKey,
        classSinhala: t.classSinhala,
        rank: "secondary_subha" as const,
      })),
    );
  return {
    primary: {
      roman: primary.roman,
      sinhala: primary.sinhala,
      pada,
      fromNekatha: primary.nekatha.spoken,
      rank: "primary_pada" as const,
    },
    secondarySubha: secondarySyllables,
    favourTara: favour,
    avoidTara: avoid,
    allRecommendedSinhala: [
      primary.sinhala,
      ...secondarySyllables.map((s) => s.sinhala),
    ].filter((v, i, a) => a.indexOf(v) === i),
  };
}

const ENGLISH_ALIASES: Record<string, string> = {
  ashwini: "Ashwini",
  aswini: "Ashwini",
  aswida: "Ashwini",
  bharani: "Bharani",
  berana: "Bharani",
  krittika: "Krittika",
  krithika: "Krittika",
  kethi: "Krittika",
  rohini: "Rohini",
  rehena: "Rohini",
  mrigashira: "Mrigashira",
  mrigashirsha: "Mrigashira",
  ardra: "Ardra",
  punarvasu: "Punarvasu",
  pushya: "Pushya",
  pushyami: "Pushya",
  ashlesha: "Ashlesha",
  magha: "Magha",
  "purva phalguni": "Purva Phalguni",
  poorva: "Purva Phalguni",
  pubba: "Purva Phalguni",
  "uttara phalguni": "Uttara Phalguni",
  uttara: "Uttara Phalguni",
  hasta: "Hasta",
  chitra: "Chitra",
  swati: "Swati",
  vishakha: "Vishakha",
  anuradha: "Anuradha",
  jyeshtha: "Jyeshtha",
  jyeshta: "Jyeshtha",
  mula: "Mula",
  moola: "Mula",
  "purva ashadha": "Purva Ashadha",
  poorvashada: "Purva Ashadha",
  "uttara ashadha": "Uttara Ashadha",
  uttarashada: "Uttara Ashadha",
  shravana: "Shravana",
  sravana: "Shravana",
  dhanishta: "Dhanishta",
  dhanishtha: "Dhanishta",
  shatabhisha: "Shatabhisha",
  satabhisha: "Shatabhisha",
  "purva bhadrapada": "Purva Bhadrapada",
  "uttara bhadrapada": "Uttara Bhadrapada",
  revati: "Revati",
};

export function findNekatha(englishName: string): NekathaRow {
  const key = englishName.trim().toLowerCase();
  const canonical = ENGLISH_ALIASES[key] ?? englishName.trim();
  const row = NEKATHA_TABLE.find(
    (n) => n.english.toLowerCase() === canonical.toLowerCase(),
  );
  if (!row) {
    throw new Error(`Unknown nakshatra: ${englishName}`);
  }
  return row;
}

export function aksharaFor(englishName: string, pada: number): NakathPada & {
  nekatha: NekathaRow;
  pada: number;
} {
  if (pada < 1 || pada > 4 || !Number.isInteger(pada)) {
    throw new Error(`Pada must be 1–4, got ${pada}`);
  }
  const nekatha = findNekatha(englishName);
  return { ...nekatha.padas[pada - 1], nekatha, pada };
}

export function degreesInNakshatra(siderealLongitude: number): {
  nekathaIndex: number;
  degreeInNakshatra: number;
  pada: number;
  degreeInPada: number;
} {
  const lon = ((siderealLongitude % 360) + 360) % 360;
  const nekathaIndex = Math.floor(lon / NAKSHATRA_SPAN) + 1;
  const degreeInNakshatra = lon % NAKSHATRA_SPAN;
  const pada = Math.floor(degreeInNakshatra / PADA_SPAN) + 1;
  const degreeInPada = degreeInNakshatra % PADA_SPAN;
  return { nekathaIndex, degreeInNakshatra, pada, degreeInPada };
}
