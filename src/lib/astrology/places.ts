/**
 * Sri Lanka birth-place presets: cities, towns, and major hospitals.
 * Coordinates are approximate city/hospital centres — override with exact lat/lon when known.
 */

export type PlaceKind = "city" | "town" | "hospital";

export type PlacePreset = {
  id: string;
  label: string;
  labelSi?: string;
  kind: PlaceKind;
  district?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  /** Street / area address when known */
  address?: string;
  notes?: string;
};

const TZ = "Asia/Colombo";

function city(
  id: string,
  label: string,
  lat: number,
  lon: number,
  extra?: Partial<PlacePreset>,
): PlacePreset {
  return {
    id,
    label,
    kind: "city",
    latitude: lat,
    longitude: lon,
    timezone: TZ,
    ...extra,
  };
}

function town(
  id: string,
  label: string,
  lat: number,
  lon: number,
  extra?: Partial<PlacePreset>,
): PlacePreset {
  return {
    id,
    label,
    kind: "town",
    latitude: lat,
    longitude: lon,
    timezone: TZ,
    ...extra,
  };
}

function hospital(
  id: string,
  label: string,
  lat: number,
  lon: number,
  address?: string,
  extra?: Partial<PlacePreset>,
): PlacePreset {
  return {
    id,
    label,
    kind: "hospital",
    latitude: lat,
    longitude: lon,
    timezone: TZ,
    address,
    ...extra,
  };
}

/** Comprehensive SL coverage — cities, towns, major hospitals. */
export const PLACE_PRESETS: PlacePreset[] = [
  // —— Major hospitals (birth-common) ——
  hospital(
    "asiri-kandy",
    "Asiri Hospital Kandy (Mulgampola)",
    7.2744,
    80.61115,
    "907 Peradeniya Rd, Mulgampola, Kandy",
    { district: "Kandy", labelSi: "අසිරි රෝහල කැන්ඩි" },
  ),
  hospital(
    "asiri-central-colombo",
    "Asiri Central Hospital Colombo",
    6.9205,
    79.855,
    "No. 114 Norris Canal Rd, Colombo 10",
    { district: "Colombo" },
  ),
  hospital(
    "asiri-surgical",
    "Asiri Surgical Hospital Colombo",
    6.8916,
    79.8685,
    "21 Kirimandala Mawatha, Colombo 5",
    { district: "Colombo" },
  ),
  hospital(
    "nawaloka-colombo",
    "Nawaloka Hospital Colombo",
    6.9218,
    79.8532,
    "23 Deshamanya H K Dharmadasa Mw, Colombo 2",
    { district: "Colombo" },
  ),
  hospital(
    "lanka-hospitals",
    "Lanka Hospitals Colombo",
    6.8912,
    79.8755,
    "578 Elvitigala Mawatha, Colombo 5",
    { district: "Colombo" },
  ),
  hospital(
    "durdans-colombo",
    "Durdans Hospital Colombo",
    6.8919,
    79.8578,
    "3 Alfred Place, Colombo 3",
    { district: "Colombo" },
  ),
  hospital(
    "ninewells-colombo",
    "Ninewells Hospital Colombo",
    6.8755,
    79.8772,
    "55/1 Kirimandala Mawatha, Colombo 5",
    { district: "Colombo" },
  ),
  hospital(
    "hemass-wattala",
    "Hemass Hospital Wattala",
    6.988,
    79.8915,
    "Wattala",
    { district: "Gampaha" },
  ),
  hospital(
    "kandy-teaching",
    "National Hospital Kandy (Teaching)",
    7.2912,
    80.6348,
    "William Gopallawa Mawatha, Kandy",
    { district: "Kandy" },
  ),
  hospital(
    "peradeniya-teaching",
    "Teaching Hospital Peradeniya",
    7.2715,
    80.5945,
    "Peradeniya",
    { district: "Kandy" },
  ),
  hospital(
    "colombo-nhsl",
    "National Hospital of Sri Lanka (Colombo)",
    6.9195,
    79.8655,
    "Regent St, Colombo 10",
    { district: "Colombo" },
  ),
  hospital(
    "de-soysa",
    "De Soysa Hospital for Women (Colombo)",
    6.9168,
    79.8622,
    "Colombo 08",
    { district: "Colombo" },
  ),
  hospital(
    "castle-street",
    "Castle Street Hospital for Women",
    6.9145,
    79.8775,
    "Castle St, Colombo 08",
    { district: "Colombo" },
  ),
  hospital(
    "karapitiya-teaching",
    "Teaching Hospital Karapitiya",
    6.0685,
    80.2255,
    "Karapitiya, Galle",
    { district: "Galle" },
  ),
  hospital(
    "jaffna-teaching",
    "Teaching Hospital Jaffna",
    9.6685,
    80.0145,
    "Hospital Rd, Jaffna",
    { district: "Jaffna" },
  ),
  hospital(
    "anuradhapura-teaching",
    "Teaching Hospital Anuradhapura",
    8.3355,
    80.4105,
    "Anuradhapura",
    { district: "Anuradhapura" },
  ),
  hospital(
    "kurunegala-teaching",
    "Teaching Hospital Kurunegala",
    7.4805,
    80.3645,
    "Kurunegala",
    { district: "Kurunegala" },
  ),
  hospital(
    "ragama-teaching",
    "Colombo North Teaching Hospital (Ragama)",
    7.0255,
    79.9225,
    "Ragama",
    { district: "Gampaha" },
  ),
  hospital(
    "kalubowila-teaching",
    "Colombo South Teaching Hospital (Kalubowila)",
    6.8655,
    79.8855,
    "Kalubowila, Dehiwala",
    { district: "Colombo" },
  ),
  hospital(
    "matara-general",
    "General Hospital Matara",
    5.9485,
    80.5425,
    "Matara",
    { district: "Matara" },
  ),
  hospital(
    "badulla-general",
    "General Hospital Badulla",
    6.9895,
    81.0565,
    "Badulla",
    { district: "Badulla" },
  ),
  hospital(
    "ratnapura-general",
    "General Hospital Ratnapura",
    6.6845,
    80.3995,
    "Ratnapura",
    { district: "Ratnapura" },
  ),
  hospital(
    "batticaloa-teaching",
    "Teaching Hospital Batticaloa",
    7.7175,
    81.7005,
    "Batticaloa",
    { district: "Batticaloa" },
  ),
  hospital(
    "trincomalee-general",
    "General Hospital Trincomalee",
    8.5715,
    81.2335,
    "Trincomalee",
    { district: "Trincomalee" },
  ),
  hospital(
    "negombo-general",
    "District General Hospital Negombo",
    7.2115,
    79.8385,
    "Negombo",
    { district: "Gampaha" },
  ),
  hospital(
    "gampaha-general",
    "General Hospital Gampaha",
    7.0895,
    79.9955,
    "Gampaha",
    { district: "Gampaha" },
  ),
  hospital(
    "nawaloka-negombo",
    "Nawaloka Hospital Negombo",
    7.2105,
    79.8485,
    "Negombo",
    { district: "Gampaha" },
  ),
  hospital(
    "sujatha-matara",
    "Sujatha Hospital Matara",
    5.9495,
    80.5485,
    "Matara",
    { district: "Matara" },
  ),

  // —— Provincial / district cities ——
  city("colombo", "Colombo", 6.9271, 79.8612, {
    district: "Colombo",
    labelSi: "කොළඹ",
  }),
  city("sri-jayawardenepura-kotte", "Sri Jayawardenepura Kotte", 6.9108, 79.9086, {
    district: "Colombo",
    labelSi: "ශ්‍රී ජයවර්ධනපුර කෝට්ටේ",
  }),
  city("dehiwala-mount-lavinia", "Dehiwala-Mount Lavinia", 6.8301, 79.8801, {
    district: "Colombo",
  }),
  city("moratuwa", "Moratuwa", 6.773, 79.8816, { district: "Colombo" }),
  city("kandy", "Kandy", 7.2906, 80.6337, {
    district: "Kandy",
    labelSi: "මහනුවර",
  }),
  city("galle", "Galle", 6.0535, 80.221, {
    district: "Galle",
    labelSi: "ගාල්ල",
  }),
  city("matara", "Matara", 5.9549, 80.555, {
    district: "Matara",
    labelSi: "මාතර",
  }),
  city("jaffna", "Jaffna", 9.6615, 80.0255, {
    district: "Jaffna",
    labelSi: "යාපනය",
  }),
  city("anuradhapura", "Anuradhapura", 8.3114, 80.4037, {
    district: "Anuradhapura",
    labelSi: "අනුරාධපුර",
  }),
  city("kurunegala", "Kurunegala", 7.4863, 80.3623, {
    district: "Kurunegala",
    labelSi: "කුරුණෑගල",
  }),
  city("ratnapura", "Ratnapura", 6.6828, 80.4012, {
    district: "Ratnapura",
    labelSi: "රත්නපුර",
  }),
  city("badulla", "Badulla", 6.9934, 81.055, {
    district: "Badulla",
    labelSi: "බදුල්ල",
  }),
  city("trincomalee", "Trincomalee", 8.5874, 81.2152, {
    district: "Trincomalee",
    labelSi: "ත්‍රිකුණාමලය",
  }),
  city("batticaloa", "Batticaloa", 7.7102, 81.6924, {
    district: "Batticaloa",
    labelSi: "මඩකලපුව",
  }),
  city("gampaha", "Gampaha", 7.0917, 79.9942, {
    district: "Gampaha",
    labelSi: "ගම්පහ",
  }),
  city("negombo", "Negombo", 7.2083, 79.8358, {
    district: "Gampaha",
    labelSi: "මීගමුව",
  }),
  city("kalutara", "Kalutara", 6.5854, 79.9607, {
    district: "Kalutara",
    labelSi: "කළුතර",
  }),
  city("panadura", "Panadura", 6.7132, 79.9026, { district: "Kalutara" }),
  city("horana", "Horana", 6.7198, 80.0618, { district: "Kalutara" }),
  city("nuwara-eliya", "Nuwara Eliya", 6.9497, 80.7891, {
    district: "Nuwara Eliya",
    labelSi: "නුවරඑළිය",
  }),
  city("matale", "Matale", 7.4675, 80.6234, {
    district: "Matale",
    labelSi: "මාතලේ",
  }),
  city("kegalle", "Kegalle", 7.2513, 80.3464, {
    district: "Kegalle",
    labelSi: "කෑගල්ල",
  }),
  city("polonnaruwa", "Polonnaruwa", 7.9403, 81.0188, {
    district: "Polonnaruwa",
    labelSi: "පොළොන්නරුව",
  }),
  city("puttalam", "Puttalam", 8.0362, 79.8283, {
    district: "Puttalam",
    labelSi: "පුත්තලම",
  }),
  city("chilaw", "Chilaw", 7.5758, 79.7953, { district: "Puttalam" }),
  city("hambantota", "Hambantota", 6.1244, 81.1185, {
    district: "Hambantota",
    labelSi: "හම්බන්තොට",
  }),
  city("ampara", "Ampara", 7.2975, 81.682, {
    district: "Ampara",
    labelSi: "අම්පාර",
  }),
  city("monaragala", "Monaragala", 6.8728, 81.3507, {
    district: "Monaragala",
    labelSi: "මොණරාගල",
  }),
  city("vavuniya", "Vavuniya", 8.7514, 80.4971, {
    district: "Vavuniya",
    labelSi: "වවුනියාව",
  }),
  city("mannar", "Mannar", 8.981, 79.9044, {
    district: "Mannar",
    labelSi: "මන්නාරම",
  }),
  city("kilinochchi", "Kilinochchi", 9.3803, 80.377, {
    district: "Kilinochchi",
    labelSi: "කිලිනොච්චි",
  }),
  city("mullaitivu", "Mullaitivu", 9.2671, 80.8142, {
    district: "Mullaitivu",
    labelSi: "මුලතිව්",
  }),
  city("point-pedro", "Point Pedro", 9.8167, 80.2333, { district: "Jaffna" }),
  city("kalmunai", "Kalmunai", 7.409, 81.8347, { district: "Ampara" }),

  // —— Towns / suburbs often used for birth ——
  town("peradeniya", "Peradeniya", 7.2699, 80.5938, { district: "Kandy" }),
  town("katugastota", "Katugastota", 7.3345, 80.6215, { district: "Kandy" }),
  town("digana", "Digana", 7.2935, 80.7385, { district: "Kandy" }),
  town("gampola", "Gampola", 7.1642, 80.5766, { district: "Kandy" }),
  town("nawalapitiya", "Nawalapitiya", 7.0445, 80.5345, { district: "Kandy" }),
  town("hatton", "Hatton", 6.8916, 80.5955, { district: "Nuwara Eliya" }),
  town("bandarawela", "Bandarawela", 6.8293, 80.9899, { district: "Badulla" }),
  town("ella", "Ella", 6.8667, 81.0466, { district: "Badulla" }),
  town("haputale", "Haputale", 6.7654, 80.9585, { district: "Badulla" }),
  town("welimada", "Welimada", 6.9015, 80.9065, { district: "Badulla" }),
  town("mahiyanganaya", "Mahiyanganaya", 7.3315, 81.0015, {
    district: "Badulla",
  }),
  town("emibilipitiya", "Embilipitiya", 6.3432, 80.8486, {
    district: "Ratnapura",
  }),
  town("balangoda", "Balangoda", 6.6602, 80.7045, { district: "Ratnapura" }),
  town("avissawella", "Avissawella", 6.9531, 80.2115, { district: "Colombo" }),
  town("homagama", "Homagama", 6.844, 80.0025, { district: "Colombo" }),
  town("maharagama", "Maharagama", 6.848, 79.9265, { district: "Colombo" }),
  town("nugegoda", "Nugegoda", 6.8649, 79.8997, { district: "Colombo" }),
  town("battaramulla", "Battaramulla", 6.8987, 79.9187, { district: "Colombo" }),
  town("rajagiriya", "Rajagiriya", 6.9105, 79.8945, { district: "Colombo" }),
  town("kotahena", "Kotahena", 6.9485, 79.8615, { district: "Colombo" }),
  town("wellawatte", "Wellawatte", 6.8745, 79.8605, { district: "Colombo" }),
  town("bambalapitiya", "Bambalapitiya", 6.8935, 79.8555, {
    district: "Colombo",
  }),
  town("borella", "Borella", 6.9145, 79.8775, { district: "Colombo" }),
  town("kiribathgoda", "Kiribathgoda", 6.9785, 79.9295, { district: "Gampaha" }),
  town("kelaniya", "Kelaniya", 6.9553, 79.922, { district: "Gampaha" }),
  town("ja-ela", "Ja-Ela", 7.0745, 79.8915, { district: "Gampaha" }),
  town("kadawatha", "Kadawatha", 7.0015, 79.9525, { district: "Gampaha" }),
  town("wattala", "Wattala", 6.9885, 79.8915, { district: "Gampaha" }),
  town("minuwangoda", "Minuwangoda", 7.1665, 79.9535, { district: "Gampaha" }),
  town("divulapitiya", "Divulapitiya", 7.23, 80.015, { district: "Gampaha" }),
  town("ragama", "Ragama", 7.0255, 79.9225, { district: "Gampaha" }),
  town("katunayake", "Katunayake", 7.1645, 79.8855, { district: "Gampaha" }),
  town("seeduwa", "Seeduwa", 7.1325, 79.8765, { district: "Gampaha" }),
  town("beruwala", "Beruwala", 6.4785, 79.9825, { district: "Kalutara" }),
  town("aluthgama", "Aluthgama", 6.4325, 79.9985, { district: "Kalutara" }),
  town("bentota", "Bentota", 6.4255, 79.9955, { district: "Galle" }),
  town("hikkaduwa", "Hikkaduwa", 6.1395, 80.1015, { district: "Galle" }),
  town("ambalangoda", "Ambalangoda", 6.2355, 80.0535, { district: "Galle" }),
  town("elpitiya", "Elpitiya", 6.2915, 80.1615, { district: "Galle" }),
  town("ahangama", "Ahangama", 5.9735, 80.3625, { district: "Galle" }),
  town("weligama", "Weligama", 5.9735, 80.4295, { district: "Matara" }),
  town("mirissa", "Mirissa", 5.9485, 80.4715, { district: "Matara" }),
  town("tangalle", "Tangalle", 6.0245, 80.7915, { district: "Hambantota" }),
  town("tissamaharama", "Tissamaharama", 6.2835, 81.2875, {
    district: "Hambantota",
  }),
  town("kataragama", "Kataragama", 6.4135, 81.3325, { district: "Monaragala" }),
  town("moneragala-town", "Buttala", 6.7275, 81.2355, {
    district: "Monaragala",
  }),
  town("wellawaya", "Wellawaya", 6.7365, 81.1025, { district: "Monaragala" }),
  town("dambulla", "Dambulla", 7.8675, 80.6515, { district: "Matale" }),
  town("sigiriya", "Sigiriya", 7.9575, 80.7605, { district: "Matale" }),
  town("habarana", "Habarana", 8.0385, 80.7515, { district: "Anuradhapura" }),
  town("kekirawa", "Kekirawa", 8.0385, 80.5685, { district: "Anuradhapura" }),
  town("medawachchiya", "Medawachchiya", 8.5405, 80.4625, {
    district: "Anuradhapura",
  }),
  town("horowpathana", "Horowpothana", 8.5545, 80.8355, {
    district: "Anuradhapura",
  }),
  town("hingurakgoda", "Hingurakgoda", 8.0415, 80.9505, {
    district: "Polonnaruwa",
  }),
  town("kaduruwela", "Kaduruwela", 7.9395, 81.0005, {
    district: "Polonnaruwa",
  }),
  town("kuliyapitiya", "Kuliyapitiya", 7.4685, 80.0455, {
    district: "Kurunegala",
  }),
  town("narammala", "Narammala", 7.4325, 80.2155, { district: "Kurunegala" }),
  town("wariyapola", "Wariyapola", 7.6235, 80.2435, { district: "Kurunegala" }),
  town("mawanella", "Mawanella", 7.2535, 80.4465, { district: "Kegalle" }),
  town("rambukkana", "Rambukkana", 7.3215, 80.3945, { district: "Kegalle" }),
  town("warakapola", "Warakapola", 7.2365, 80.1985, { district: "Kegalle" }),
  town("ruwanwella", "Ruwanwella", 7.0455, 80.2535, { district: "Kegalle" }),
  town("akurella", "Akuressa", 6.1665, 80.4765, { district: "Matara" }),
  town("deniyaya", "Deniyaya", 6.3425, 80.5595, { district: "Matara" }),
  town("kamburupitiya", "Kamburupitiya", 6.0785, 80.5625, {
    district: "Matara",
  }),
  town("chavakachcheri", "Chavakachcheri", 9.6615, 80.1655, {
    district: "Jaffna",
  }),
  town("valvettithurai", "Valvettithurai", 9.8165, 80.1665, {
    district: "Jaffna",
  }),
  town("kayts", "Kayts", 9.7005, 79.8505, { district: "Jaffna" }),
  town("akkaraipattu", "Akkaraipattu", 7.2165, 81.8495, { district: "Ampara" }),
  town("sammanthurai", "Sammanthurai", 7.3625, 81.7985, { district: "Ampara" }),
  town("pottuvil", "Pottuvil", 6.8765, 81.8305, { district: "Ampara" }),
  town("arugam-bay", "Arugam Bay", 6.8405, 81.8365, { district: "Ampara" }),
  town("chenkalady", "Chenkalady", 7.7835, 81.5955, { district: "Batticaloa" }),
  town("kattankudy", "Kattankudy", 7.6805, 81.7305, { district: "Batticaloa" }),
  town("kinniya", "Kinniya", 8.4985, 81.1805, { district: "Trincomalee" }),
  town("nilaveli", "Nilaveli", 8.6925, 81.1885, { district: "Trincomalee" }),
  town("weligepola", "Weligepola", 6.5805, 80.6605, { district: "Ratnapura" }),
  town("pelmadulla", "Pelmadulla", 6.6205, 80.5405, { district: "Ratnapura" }),
  town("eheliyagoda", "Eheliyagoda", 6.8505, 80.2605, {
    district: "Ratnapura",
  }),
  town("kuruwita", "Kuruwita", 6.7805, 80.3705, { district: "Ratnapura" }),
];

export function listPlacesGrouped(): {
  hospitals: PlacePreset[];
  cities: PlacePreset[];
  towns: PlacePreset[];
} {
  return {
    hospitals: PLACE_PRESETS.filter((p) => p.kind === "hospital"),
    cities: PLACE_PRESETS.filter((p) => p.kind === "city"),
    towns: PLACE_PRESETS.filter((p) => p.kind === "town"),
  };
}

export function searchPlaces(query: string, limit = 40): PlacePreset[] {
  const q = query.trim().toLowerCase();
  if (!q) return PLACE_PRESETS.slice(0, limit);
  const scored = PLACE_PRESETS.map((p) => {
    const hay = [
      p.id,
      p.label,
      p.labelSi ?? "",
      p.district ?? "",
      p.address ?? "",
      p.notes ?? "",
    ]
      .join(" ")
      .toLowerCase();
    let score = 0;
    if (p.id === q) score += 100;
    if (p.label.toLowerCase().startsWith(q)) score += 50;
    if (hay.includes(q)) score += 20;
    for (const part of q.split(/\s+/)) {
      if (part && hay.includes(part)) score += 5;
    }
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.label.localeCompare(b.p.label));
  return scored.slice(0, limit).map((x) => x.p);
}

export function resolvePlace(input: {
  placeId?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}): {
  latitude: number;
  longitude: number;
  timezone: string;
  label: string;
  matchedPresetId: string | null;
  address: string | null;
} {
  if (
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude)
  ) {
    const preset = input.placeId
      ? PLACE_PRESETS.find((p) => p.id === input.placeId)
      : input.placeName
        ? searchPlaces(input.placeName, 1)[0]
        : undefined;
    return {
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: input.timezone ?? preset?.timezone ?? TZ,
      label:
        input.placeName?.trim() ||
        preset?.label ||
        `Custom (${input.latitude.toFixed(5)}, ${input.longitude.toFixed(5)})`,
      matchedPresetId: preset?.id ?? null,
      address: preset?.address ?? input.placeName?.trim() ?? null,
    };
  }

  if (input.placeId && input.placeId !== "custom") {
    const preset = PLACE_PRESETS.find((p) => p.id === input.placeId);
    if (!preset) {
      throw new Error(
        `Unknown placeId "${input.placeId}". Search places, pick a preset, or pass latitude+longitude.`,
      );
    }
    return {
      latitude: preset.latitude,
      longitude: preset.longitude,
      timezone: input.timezone ?? preset.timezone,
      label: preset.label,
      matchedPresetId: preset.id,
      address: preset.address ?? null,
    };
  }

  if (input.placeName) {
    const hits = searchPlaces(input.placeName, 1);
    if (hits[0]) {
      const preset = hits[0];
      return {
        latitude: preset.latitude,
        longitude: preset.longitude,
        timezone: input.timezone ?? preset.timezone,
        label: preset.label,
        matchedPresetId: preset.id,
        address: preset.address ?? input.placeName,
      };
    }
    throw new Error(
      `Place "${input.placeName}" not found in presets. Enter latitude and longitude manually.`,
    );
  }

  throw new Error(
    "Birth place required: choose a city/hospital, enter an address match, or type latitude + longitude.",
  );
}
