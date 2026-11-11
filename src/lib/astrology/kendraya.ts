import { calculationConfigSchema, DEFAULT_CALCULATION_CONFIG, AYANAMSA_LABELS, type CalculationConfig } from "./config";
import { applyConfiguredNodes, configuredBirthSunrise } from "./configured-positions";
import { vimshottari } from "./vimshottari";
import { birthDay } from "./birth-day";
import { computeChart } from "vpv-panchangam";
import {
  degreesInNakshatra,
  findNekatha,
  namingLetterSet,
} from "./nakath-akshara";
import {
  LAGNA_LETTERS,
  WEEKDAY_LETTERS,
} from "./letter-pools";
import { resolvePlace } from "./places";
import { BHAVA, grahaLabel, rashiLabel } from "./sinhala-names";

export type BirthInput = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or HH:MM:SS local
  placeId?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  /** Default Lahiri — Sri Lankan standard */
  ayanamsa?: "lahiri" | "kp_new" | "raman";
  gender?: "male" | "female" | "unspecified";
  nativeName?: string;
};

type PlanetRow = {
  name: string;
  longitude: number;
  sign: string;
  degree_in_sign: number;
  dms: string;
  nakshatra: string;
  nakshatra_pada: number;
  nakshatra_lord: string;
  house: number;
  retrograde: boolean;
  combust: boolean;
  exalted: boolean;
  debilitated: boolean;
  own_sign: boolean;
  vargottama: boolean;
};

function normalizeTime(time: string): string {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) {
    throw new Error(`time must be HH:MM or HH:MM:SS, got "${time}"`);
  }
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = m[3] ? Number(m[3]) : 0;
  if (hh > 23 || mm > 59 || ss > 59) {
    throw new Error(`Invalid clock time: ${time}`);
  }
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}${
    m[3] ? `:${String(ss).padStart(2, "0")}` : ""
  }`;
}

function normalizeDate(date: string): string {
  const m = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    throw new Error(`date must be YYYY-MM-DD, got "${date}"`);
  }
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function classicNavagraha(planets: PlanetRow[]): PlanetRow[] {
  const order = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
    "Rahu",
    "Ketu",
  ];
  const byName = new Map(planets.map((p) => [p.name, p]));
  return order
    .map((name) => byName.get(name))
    .filter((p): p is PlanetRow => Boolean(p));
}

function padaBorderWarning(
  moonLon: number,
): { nearPadaSandhi: boolean; degreesToPadaEdge: number } {
  const { degreeInPada } = degreesInNakshatra(moonLon);
  const toPrev = degreeInPada;
  const toNext = 3 + 1 / 3 - degreeInPada;
  const degreesToPadaEdge = Math.min(toPrev, toNext);
  // ~12 arc-minutes ≈ birth-time sensitivity of a few minutes
  return {
    nearPadaSandhi: degreesToPadaEdge < 0.2,
    degreesToPadaEdge: Number(degreesToPadaEdge.toFixed(4)),
  };
}

export async function castKendraya(input: BirthInput, settings?: CalculationConfig, options?: { precise?: boolean }) {
  const config = calculationConfigSchema.parse(settings ?? { ...DEFAULT_CALCULATION_CONFIG, ayanamsa: input.ayanamsa ?? "lahiri" });
  const date = normalizeDate(input.date);
  const time = normalizeTime(input.time);
  const place = resolvePlace(input);
  const ayanamsa = config.ayanamsa;

  const raw = await computeChart(
    {
      date,
      time: time.length === 5 ? time : time.slice(0, 5),
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone,
      ayanamsa,
    },
    "en",
  );

  applyConfiguredNodes(raw, config);
  const planets = classicNavagraha(raw.planets_data as PlanetRow[]);
  const moon = planets.find((p) => p.name === "Moon");
  if (!moon) {
    throw new Error("Moon position missing from ephemeris result");
  }

  const nekatha = findNekatha(moon.nakshatra);
  const letterSet = namingLetterSet(moon.nakshatra, moon.nakshatra_pada);
  const border = padaBorderWarning(moon.longitude);
  const lagnaRashi = rashiLabel(raw.ascendant.sign);
  const chandraRashi = rashiLabel(moon.sign);
  const day = await birthDay(date, raw.birth.utc_time, place.latitude, place.longitude, place.timezone);
  const weekday = config.sunriseDisc === "upper-limb" && config.sunriseRefraction
    ? day.weekday : configuredBirthSunrise(raw.birth.utc_time, place.latitude, place.longitude, place.timezone, config).weekday;
  const weekdayLetters = WEEKDAY_LETTERS[weekday] ?? [];
  const lagnaLetters = LAGNA_LETTERS[lagnaRashi.english] ?? [];
  const especiallyGood = letterSet.allRecommendedSinhala.filter(
    (s) => lagnaLetters.includes(s) || weekdayLetters.includes(s),
  );

  const grahaPlacement = planets.map((p) => {
    const g = grahaLabel(p.name);
    const r = rashiLabel(p.sign);
    const n = findNekatha(p.nakshatra);
    return {
      graha: g.english,
      grahaSinhala: g.sinhala,
      grahaSpoken: g.spoken,
      rashi: r.english,
      rashiSinhala: r.sinhala,
      degreeInRashi: p.dms,
      longitude: Number(p.longitude.toFixed(6)),
      ...(options?.precise ? { longitudeExact: p.longitude } : {}),
      bhava: p.house,
      bhavaThemes: BHAVA[p.house]?.themes ?? "",
      nekatha: n.english,
      nekathaSinhala: n.sinhala,
      nekathaSpoken: n.spoken,
      pada: p.nakshatra_pada,
      nakshatraLord: p.nakshatra_lord,
      retrograde: p.retrograde,
      combust: p.combust,
      exalted: p.exalted,
      debilitated: p.debilitated,
      ownSign: p.own_sign,
      vargottama: p.vargottama,
    };
  });

  const bhavaMap: Record<string, string[]> = {};
  for (let h = 1; h <= 12; h++) {
    bhavaMap[String(h)] = grahaPlacement
      .filter((g) => g.bhava === h)
      .map((g) => g.graha);
  }

  const dasha = vimshottari(moon.longitude, raw.birth.utc_time, config.dasaYearDays);
  const mahaDasha = dasha.maha.map((d) => ({
    lord: d.lord,
    lordSinhala: grahaLabel(d.lord).sinhala,
    startUtc: d.start,
    endUtc: d.end,
    years: Number(d.years.toFixed(4)),
  }));

  const currentMaha = mahaDasha[0];
  const firstAntar = dasha.antar[0];
  const currentAntar = firstAntar ? {
    mahaLord: currentMaha.lord, antarLord: firstAntar.lord,
    startUtc: firstAntar.start, endUtc: firstAntar.end,
  } : null;

  const kalsarpa = raw.kalsarpa as {
    present: boolean;
    verdict: string;
    kind: string | null;
    direction: string | null;
    rahu_house: number;
    ketu_house: number;
  };

  const result = {
    tradition: {
      system: "Sri Lankan Handahana / Kendraya",
      ayanamsa: AYANAMSA_LABELS[ayanamsa],
      ayanamsaDegrees: Number(raw.birth.ayanamsa.toFixed(6)),
      houseStyle: "Whole-sign (rāśi) houses from Lagna",
      ephemeris: "Swiss Ephemeris (WASM) via Drik Ganita",
      notes: [
        "Clock time is treated as civil local time in the given timezone (Sri Lanka: Asia/Colombo, UTC+5:30, no DST).",
        "Naming letters (Nam Thebima) follow Chandra Nakshatra pada — not Lagna.",
        "Chart shows tendencies and timing, not fixed fate.",
      ],
    },
    native: {
      name: input.nativeName ?? null,
      gender: input.gender ?? "unspecified",
      date,
      timeLocal: time,
      timezone: place.timezone,
      placeLabel: place.label,
      latitude: place.latitude,
      longitude: place.longitude,
      matchedPresetId: place.matchedPresetId,
      julianDay: raw.birth.julian_day,
      utcTime: raw.birth.utc_time,
    },
    lagna: {
      rashi: lagnaRashi.english,
      rashiSinhala: lagnaRashi.sinhala,
      degreeInRashi: raw.ascendant.dms,
      longitude: Number(raw.ascendant.longitude.toFixed(6)),
      ...(options?.precise ? { longitudeExact: raw.ascendant.longitude } : {}),
      nekatha: raw.ascendant.nakshatra,
      pada: raw.ascendant.nakshatra_pada,
      lord: lagnaRashi.lord,
    },
    chandra: {
      rashi: chandraRashi.english,
      rashiSinhala: chandraRashi.sinhala,
      degreeInRashi: moon.dms,
      longitude: Number(moon.longitude.toFixed(6)),
      ...(options?.precise ? { longitudeExact: moon.longitude } : {}),
      nekatha: nekatha.english,
      nekathaSinhala: nekatha.sinhala,
      nekathaSpoken: nekatha.spoken,
      pada: moon.nakshatra_pada,
      nekathaLord: nekatha.lord,
      vargottama: moon.vargottama,
      houseFromLagna: moon.house,
    },
    namThebima: {
      primaryAksharaRoman: letterSet.primary.roman,
      primaryAksharaSinhala: letterSet.primary.sinhala,
      rule: "Prefer the Moon pada syllable; also offer letters from Tara subha-class nekathas (sampath, kshema, sadhaka, maitri, parama maitri).",
      letterSet: {
        primary: letterSet.primary,
        secondarySubha: letterSet.secondarySubha,
        allRecommendedSinhala: letterSet.allRecommendedSinhala,
        especiallyGood,
        lagnaLetters,
        weekdayLetters,
        weekdayIndex: weekday,
        favourTara: letterSet.favourTara.map((t) => ({
          classKey: t.classKey,
          classSinhala: t.classSinhala,
          nekathaSpoken: t.spoken,
          syllablesSinhala: t.syllables.map((s) => s.sinhala),
        })),
        avoidTara: letterSet.avoidTara.map((t) => ({
          classKey: t.classKey,
          classSinhala: t.classSinhala,
          nekathaSpoken: t.spoken,
        })),
      },
      allPadasOfBirthNekatha: nekatha.padas.map((p, i) => ({
        pada: i + 1,
        roman: p.roman,
        sinhala: p.sinhala,
        isBirthPada: i + 1 === moon.nakshatra_pada,
      })),
      nearPadaSandhi: border.nearPadaSandhi,
      degreesToPadaEdge: border.degreesToPadaEdge,
      guidance: [
        "Primary sound is strongest; secondary subha letters are also traditionally usable.",
        "Use phonetic start, not English spelling (මො → Mohan / names pronounced with Mo).",
        "Vowel-marked letters also allow the base consonant (මො / මෝ → ම, e.g. මලිත්, මනෝජ්).",
        "Middle name and surname need not follow Nakath Akshara.",
        "Hold Nam Thebima at a Subha Nekatha; avoid Rahu Kalaya for the naming moment.",
        "Complete Handahana also reads Lagna, bhava, yogas, and Vimshottari — not letters alone.",
      ],
    },
    navagraha: grahaPlacement,
    bhavaOccupants: bhavaMap,
    bhavaMeanings: Object.fromEntries(
      Object.entries(BHAVA).map(([k, v]) => [
        k,
        { sanskrit: v.sanskrit, sinhala: v.sinhala, themes: v.themes },
      ]),
    ),
    vimshottari: {
      balanceAtBirth: currentMaha,
      convention: { yearDays: dasha.yearDays, elapsedFraction: dasha.elapsedFraction },
      currentAntardashaAtBirth: currentAntar,
      mahaDashas: mahaDasha,
    },
    varga: {
      d1Asc: String(raw.d1_asc_sign),
      d9Asc: String(raw.d9_asc_sign),
    },
    yogas: {
      kalsarpaPresent: Boolean(kalsarpa.present),
      kalsarpaVerdict: String(kalsarpa.verdict),
      kalsarpaKind: kalsarpa.kind,
      kalsarpaDirection: kalsarpa.direction,
      rahuHouse: kalsarpa.rahu_house,
      ketuHouse: kalsarpa.ketu_house,
    },
  };
  return result;
}

export async function namThebimaOnly(input: BirthInput) {
  const full = await castKendraya(input);
  return {
    native: full.native,
    tradition: {
      ayanamsa: full.tradition.ayanamsa,
      ayanamsaDegrees: full.tradition.ayanamsaDegrees,
      ephemeris: full.tradition.ephemeris,
    },
    chandra: full.chandra,
    lagna: {
      rashi: full.lagna.rashi,
      rashiSinhala: full.lagna.rashiSinhala,
    },
    namThebima: full.namThebima,
    sampleBoyNamesHint:
      full.namThebima.primaryAksharaSinhala === "මො"
        ? [
            "Primary මො: Mohan, Mohith/Mohit, names starting with Mo-",
            "Base consonant ම is also allowed: මලිත්, මනෝජ්, මිහිරි, මාලනි…",
            `Also consider secondary subha letters: ${full.namThebima.letterSet.allRecommendedSinhala.join(", ")}`,
          ]
        : [
            `Primary: ${full.namThebima.primaryAksharaRoman} (${full.namThebima.primaryAksharaSinhala})`,
            `Full recommended set: ${full.namThebima.letterSet.allRecommendedSinhala.join(", ")}`,
          ],
  };
}
